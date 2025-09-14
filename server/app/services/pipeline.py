import os
import cv2
import numpy as np
from collections import defaultdict, deque
from typing import Any, Iterator, Optional
from pydantic import ValidationError
from app.modules.module import ModuleBase
from app.schemas.pipeline import PipelineModule
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.module_registry import ModuleRegistry
import uuid
import base64
from app.schemas.metrics import Metrics
from app.modules.utils.enums import ModuleName
from pathlib import Path
from app.schemas.pipeline import ExamplePipeline
from app.utils.quality_metrics import compute_psnr, compute_ssim
import json
import queue
import threading
import multiprocessing as mp
from multiprocessing.process import BaseProcess

EXAMPLES_DIR = Path(__file__).parent.parent / "db/examples"


def get_module_class(module: PipelineModule) -> str:
    return module.module_class


# Process a single frame through the pipeline
def process_pipeline_frame(
    frame_cache: dict[str, np.ndarray],
    ordered_modules: list[PipelineModule],
    module_map: dict[str, tuple[ModuleBase, dict[str, Any]]],
) -> None:
    for mod in ordered_modules:
        mod_id = mod.id
        mod_instance, params = module_map[mod_id]

        input_frames = [frame_cache[src_id] for src_id in mod.source]
        frame_output = mod_instance.process_frame(input_frames[0], params)
        frame_cache[mod_id] = frame_output


# Get modules in correct execution order in the pipeline
def get_execution_order(modules: list[PipelineModule]) -> list[PipelineModule]:
    # Map module id -> module
    module_map: dict[str, PipelineModule] = {mod.id: mod for mod in modules}
    all_module_ids = set(module_map.keys())

    # Build the dependency graph (adjacency list of dependent ids)
    graph: defaultdict[str, list[str]] = defaultdict(list)

    # Tracks how many dependecies each module has
    indegree: dict[str, int] = {mod.id: len(mod.source) for mod in modules}

    for mod in modules:
        if mod.source:
            for dep_id in mod.source:
                if dep_id not in all_module_ids:
                    raise ValueError(
                        f"Pipeline contains an invalid reference: {dep_id}"
                    )
                graph[dep_id].append(mod.id)

    # Start with modules that have no dependencies
    queue: deque[str] = deque(
        [module_id for module_id, degree in indegree.items() if degree == 0]
    )
    execution_order: list[PipelineModule] = []

    while queue:
        current_id = queue.popleft()
        execution_order.append(module_map[current_id])

        for dependent_id in graph[current_id]:
            indegree[dependent_id] -= 1
            if indegree[dependent_id] == 0:
                queue.append(dependent_id)

    remaining_with_deps = [
        module_id for module_id, degree in indegree.items() if degree > 0
    ]
    if remaining_with_deps:
        raise ValueError(
            f"Pipeline contains a cycle involving module IDs: {remaining_with_deps}"
        )

    return execution_order


def _metrics_worker(
    in_q: mp.Queue[tuple[int, np.ndarray, np.ndarray] | None],
    out_q: mp.Queue[tuple[int, float | None, float | None]],
):
    """
    Background process that computes image quality metrics for frame pairs.

    This worker runs in its own process and continuously reads items from
    `in_q`. Each item must be a tuple: `(index, y1, y2)` where:
      - `index` (int): the frame index, used to preserve ordering upstream.
      - `y1` (np.ndarray): first image (grayscale, uint8) for comparison.
      - `y2` (np.ndarray): second image (grayscale, uint8) for comparison.

    For each item, the worker computes:
      - PSNR via `compute_psnr(y1, y2)`
      - SSIM via `compute_ssim(y1, y2)`

    It then pushes a result tuple `(index, psnr, ssim)` to `out_q`.
    If a computation error occurs, it pushes `(index, None, None)`.

    The worker terminates when it receives a sentinel `None` from `in_q`.

    Notes:
      - Inputs are expected to be single-channel (grayscale) arrays to keep
        cross-process payloads small and avoid per-frame color conversion here.
      - This process is CPU-bound; running it out-of-process avoids the GIL and
        prevents blocking the encoder threads.
    """
    print(f"[metrics_worker] pid={os.getpid()}")
    while True:
        item: tuple[int, np.ndarray, np.ndarray] | None = in_q.get()
        if item is None:
            break
        index, y1, y2 = item
        try:
            psnr = compute_psnr(y1, y2)
            ssim = compute_ssim(y1, y2)
            out_q.put((index, float(psnr), float(ssim)))
        except Exception:
            out_q.put((index, None, None))


def handle_pipeline_request(request: PipelineRequest) -> PipelineResponse:
    """
    Runs a video processing pipeline from source to results.

    - Validates pipeline structure and module parameters.
    - Streams frames through modules, encoders, and queues.
    - Optionally spawns worker processes to compute per-frame metrics
      (PSNR/SSIM) between outputs or against the original.
    - Collects encoded video paths and metrics into a PipelineResponse.
    """
    ordered_modules: list[PipelineModule] = get_execution_order(request.modules)
    # Validate pipeline structure
    if not ordered_modules:
        raise ValueError("Pipeline is empty")

    first_module_base = get_module_class(ordered_modules[0])
    if first_module_base != ModuleName.VIDEO_SOURCE:
        raise ValueError(
            f"Pipeline must start with a {ModuleName.VIDEO_SOURCE} module."
        )

    last_module_base = get_module_class(ordered_modules[-1])
    if last_module_base != ModuleName.RESULT:
        raise ValueError(f"Pipeline must end with a {ModuleName.RESULT} module.")

    module_map: dict[str, tuple[ModuleBase, dict[str, Any]]] = {
        m.id: (
            ModuleRegistry.get_by_spacename(get_module_class(m)),
            {p.key: p.value for p in m.parameters},
        )
        for m in ordered_modules
    }

    # Validate module parameters
    for mod in ordered_modules:
        mod_id = mod.id
        mod_instance, params = module_map[mod_id]
        param_dict = {p.key: p.value for p in mod.parameters}
        try:
            validated = mod_instance.parameter_model(**param_dict)
        except ValidationError as e:
            raise ValueError(f"Parameter validation failed for module {mod.name}:\n{e}")
        module_map[mod_id] = (mod_instance, validated.model_dump())

    # Get source and result module
    source_mod = ordered_modules[0]
    result_modules = [
        module
        for module in ordered_modules
        if get_module_class(module) == ModuleName.RESULT
    ]

    # Check and validate result modules
    if not result_modules:
        raise ValueError(
            "Each pipeline must end with at least one Video Output. Please add one to complete it."
        )
    if len(result_modules) > 2:
        raise ValueError(
            "Maximum of two Video Output modules allowed. Please remove one to proceed."
        )
    for result_mod in result_modules:
        if not result_mod.source:
            raise ValueError(
                "Each Video Output module must be connected to a valid input."
            )
        if source_mod.id in result_mod.source:
            raise ValueError(
                "A Video Source can’t connect directly to a Video Output. Please add a processing module "
                "between them."
            )

    # Get processing nodes (remove source and result modules)
    processing_nodes = [
        m
        for m in ordered_modules
        if m.module_class not in {ModuleName.VIDEO_SOURCE, ModuleName.RESULT}
    ]

    with module_map[source_mod.id][0].process(None, module_map[source_mod.id][1]) as (
        source_file,
        fps,
        frame_iter,
    ):

        def base_pipeline_iterator() -> Iterator[
            tuple[str, int, np.ndarray, np.ndarray]
        ]:
            """
            Runs frames through the entire pipeline and returns the frames that need to be encoded.

            This method does not significantly contribute to video processing times.
            """
            frame_cache: dict[str, np.ndarray] = {}
            index = 0
            for frame in frame_iter:
                frame_cache.clear()
                frame_cache[source_mod.id] = frame
                # Process frames and save them to a frame cache
                process_pipeline_frame(frame_cache, processing_nodes, module_map)
                for result_mod in result_modules:
                    for sid in result_mod.source:
                        # Yield the result module and the corresponding frames to be written
                        yield (
                            result_mod.id,
                            index,
                            frame_cache[sid],
                            frame_cache[source_mod.id],
                        )
                index += 1

        # Save frames in a queue. Max size of queue is currently 2x encoder lookahead.
        # Can be lowered to reduce memory usage.
        frame_queues: dict[str, queue.Queue[Optional[np.ndarray]]] = {
            mod.id: queue.Queue(maxsize=50) for mod in result_modules
        }

        cancel = threading.Event()

        # Spin up one thread per result encoder. Each consumes from its own queue
        encoder_threads: list[threading.Thread] = []
        outputs: list[dict[str, str]] = []
        thread_errors: dict[str, Exception] = {}

        def run_encoder_thread(
            inst: ModuleBase,
            mod_id: str,
            frame_queue: queue.Queue[np.ndarray],
            params: dict[str, Any],
        ) -> None:
            """
            Consumes frames from a queue and encodes them with the given module.
            Runs in its own thread per result module. On completion or error, updates
            shared state to signal encoder success or failure.
            """
            try:
                inst.process(frame_queue, params)
            except Exception as e:
                thread_errors[mod_id] = e
                print(f"[Encoder {mod_id}] ERROR: {e!r}")

        for result_mod in result_modules:
            _, base_params = module_map[result_mod.id]
            params = dict(base_params)  # Avoid mutation conflicts

            # Create video file name
            unique_id = uuid.uuid4()
            filename_base64 = (
                base64.urlsafe_b64encode(unique_id.bytes).decode("utf-8").rstrip("=")
            )
            filename = f"{source_file}-{filename_base64}.webm"

            params["path"] = filename
            params["fps"] = fps

            inst = ModuleRegistry.get_by_spacename(get_module_class(result_mod))

            thread = threading.Thread(
                target=run_encoder_thread,
                args=(inst, result_mod.id, frame_queues[result_mod.id], params),
                name=f"encoder-{result_mod.id}",
                daemon=True,
            )
            outputs.append({"video_player": params["video_player"], "path": filename})

            thread.start()
            encoder_threads.append(thread)

        # Metrics process spawning. Uses multiprocessing as metrics (SSIM) extremely CPU intensive.
        # Increasing metric processes results in diminishing returns.
        METRIC_PROCESSES = 2
        ctx = mp.get_context("spawn")
        m_in_queues: list[mp.Queue[Optional[tuple[int, np.ndarray, np.ndarray]]]] = [
            ctx.Queue(maxsize=128) for _ in range(METRIC_PROCESSES)
        ]
        m_out: mp.Queue[tuple[int, float, float]] = ctx.Queue()
        m_procs: list[BaseProcess] = []
        for i in range(METRIC_PROCESSES):
            p = ctx.Process(
                target=_metrics_worker,
                args=(m_in_queues[i], m_out),
                daemon=True,
                name=f"metrics-{i}",
            )
            p.start()
            m_procs.append(p)
            print(f"[METRICS] started {p.name} pid={p.pid}")
        metrics_by_index: dict[int, tuple[float | None, float | None]] = {}

        def _drain_metrics():
            """
            Pulls all available metric results from the output queue without blocking.

            Each result is a tuple `(index, psnr, ssim)`, which is stored in
            `metrics_by_index` for later assembly into the final metrics list.
            This ensures ordering is preserved without stalling frame processing.
            """
            while True:
                try:
                    index, psnr, ssim = m_out.get_nowait()
                    metrics_by_index[index] = (psnr, ssim)
                except queue.Empty:
                    break

        metrics: list[Metrics] = []
        left_id = right_id = None
        pending: dict[str, dict[int, np.ndarray]] = {}
        if len(result_modules) == 2:
            left_id, right_id = result_modules[0].id, result_modules[1].id
            # Buffer frames by index until both sides are generated
            pending = {left_id: {}, right_id: {}}

        # Dispatch frames from base_pipeline_iterator and compute metrics
        try:
            for mod_id, index, frame, orig in base_pipeline_iterator():
                if cancel.is_set():
                    break
                try:
                    frame_queues[mod_id].put(frame, timeout=5)
                except queue.Full:
                    print(
                        "[Queue] Blocked frame queue for more than 5s, cancelling request"
                    )
                    cancel.set()
                    break

                # Compare metrics for two pipeline outputs
                if left_id and right_id:
                    pending[mod_id][index] = frame
                    counterpart_id = left_id if mod_id == right_id else right_id
                    other = pending[counterpart_id]
                    if index in other:
                        f1 = pending[mod_id].pop(index)
                        f2 = other.pop(index)
                        if f1.shape == f2.shape:
                            # Convert to GRAY here to keep IPC payload smaller
                            # OpenCV incomplete type stubs here
                            y1: np.ndarray = cv2.cvtColor(f1, cv2.COLOR_BGR2GRAY)  # type: ignore[attr-defined]
                            y2: np.ndarray = cv2.cvtColor(f2, cv2.COLOR_BGR2GRAY)  # type: ignore[attr-defined]
                            try:
                                # Split frames equally amongst metric processes
                                m_in_queues[index % METRIC_PROCESSES].put(
                                    (index, y1, y2), timeout=0.05
                                )  # type: ignore[arg-type]
                            except Exception:
                                pass
                        else:
                            # record mismatch immediately (no process needed)
                            metrics_by_index.setdefault(index, (None, None))
                # Compute metrics for original video + processed video with a single pipeline
                elif len(result_modules) == 1:
                    if frame.shape == orig.shape:
                        y1: np.ndarray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # type: ignore[attr-defined]
                        y2: np.ndarray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)  # type: ignore[attr-defined]
                        try:
                            m_in_queues[index % METRIC_PROCESSES].put(
                                (index, y1, y2), timeout=0.05
                            )  # type: ignore[arg-type]
                        except Exception:
                            pass
                    else:
                        metrics_by_index.setdefault(index, (None, None))

                # Occasionally drain results
                if (index % 10) == 0:
                    _drain_metrics()

        finally:
            for q in frame_queues.values():
                try:
                    q.put_nowait(None)
                except queue.Full:
                    try:
                        q.get_nowait()
                    except queue.Empty:
                        pass
                    try:
                        q.put_nowait(None)
                    except queue.Full:
                        pass

            # Stop encoding threads and metrics processes
            for thread in encoder_threads:
                thread.join()
            if thread_errors:
                raise RuntimeError(f"Encoder thread failed: {thread_errors}")

            for q in m_in_queues:
                try:
                    q.put(None)
                except Exception:
                    pass
            for p in m_procs:
                p.join(timeout=5)
            for p in m_procs:
                if p.is_alive():
                    p.terminate()

            # Final drain of metrics
            _drain_metrics()

        output_map = {entry["video_player"]: entry["path"] for entry in outputs}

        if metrics_by_index:
            for index in sorted(metrics_by_index.keys()):
                psnr, ssim = metrics_by_index[index]
                if psnr is None or ssim is None:
                    metrics.append(
                        Metrics(
                            message="Metrics could not be computed due to mismatched resolutions or an internal error",
                            psnr=None,
                            ssim=None,
                        )
                    )
                else:
                    metrics.append(Metrics(message=None, psnr=psnr, ssim=ssim))

        response = PipelineResponse(
            left=output_map.get("left", ""),
            right=output_map.get("right", ""),
            metrics=metrics,
        )
        return response


def list_examples() -> list[ExamplePipeline]:
    example_pipelines: list[ExamplePipeline] = []

    module_classes = {
        m.data.module_class
        for m in ModuleRegistry.get_all().values()
        if hasattr(m, "data") and hasattr(m.data, "module_class")
    }

    for file in sorted(EXAMPLES_DIR.glob("*.json")):
        try:
            raw = json.loads(file.read_text())
            raw["id"] = file.stem
            nodes = raw.get("nodes", [])

            if not all(
                node.get("data", {}).get("module_class") in module_classes
                for node in nodes
            ):
                print(f"Skipping {file.name} — unsupported module found")
                continue

            example_pipelines.append(ExamplePipeline.model_validate(raw))

        except json.JSONDecodeError:
            # TODO: replace print with proper logging & structured error response
            print(f"Skipping {file.name} — bad JSON syntax")
        except ValidationError as e:
            # TODO: replace print with proper logging & structured error response
            print(f"Skipping {file.name} — schema fail: {e}")

    return example_pipelines
