import numpy as np
from collections import defaultdict, deque
from typing import Any
from pydantic import ValidationError
from app.modules.module import ModuleBase
from app.schemas.pipeline import PipelineModule
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.module_registry import ModuleRegistry
import uuid
import base64
from app.utils.quality_metrics import compute_metrics
from app.schemas.metrics import Metrics
from app.modules.utils.enums import ModuleName
from typing import Deque


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


# Validate and set up the pipeline
def prepare_pipeline(
    request: PipelineRequest,
) -> tuple[
    list[PipelineModule],
    dict[str, tuple[ModuleBase, dict[str, Any]]],
    PipelineModule,
    list[PipelineModule],
    list[PipelineModule],
]:
    ordered_modules: list[PipelineModule] = get_execution_order(request.modules)
    # Validate pipeline structure
    if not ordered_modules:
        raise ValueError("Pipeline is empty")

    first_module_base = get_module_class(ordered_modules[0])
    if first_module_base != ModuleName.VIDEO_SOURCE:
        raise ValueError(f"Pipeline must start with a {ModuleName.VIDEO_SOURCE} module")

    last_module_base = get_module_class(ordered_modules[-1])
    if last_module_base != ModuleName.RESULT:
        raise ValueError(f"Pipeline must end with a {ModuleName.RESULT} module")

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
        mod_instance, _ = module_map[mod_id]
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
        raise ValueError("Pipeline must end with at least one result module")
    if len(result_modules) > 2:
        raise ValueError("A maximum of two processed results is supported")
    for result_mod in result_modules:
        if not result_mod.source:
            raise ValueError("Output source cannot be empty")
        if source_mod.id in result_mod.source:
            raise ValueError("Pipeline must have at least one processing node")

    # Get processing nodes (remove source and result modules)
    processing_nodes = [
        m
        for m in ordered_modules
        if m.module_class not in {ModuleName.VIDEO_SOURCE, ModuleName.RESULT}
    ]

    return ordered_modules, module_map, source_mod, result_modules, processing_nodes


# Handle the pipeline request and process the video
def handle_pipeline_request(request: PipelineRequest) -> PipelineResponse:
    # Prepare ordered modules, module mapping, and processing nodes
    (_, module_map, source_mod, result_modules, processing_nodes) = prepare_pipeline(
        request
    )

    metrics: list[Metrics] = []

    with module_map[source_mod.id][0].process(None, module_map[source_mod.id][1]) as (
        source_file,
        fps,
        frame_iter,
    ):
        # Generators for standard outputs
        output_queues: dict[str, Deque[np.ndarray]] = {
            mod.id: deque() for mod in result_modules
        }
        if len(result_modules) == 1:
            output_queues["original"] = deque()

        # Process frames
        for frame in frame_iter:
            frame_cache: dict[str, np.ndarray] = {}
            original_frame = frame.copy()
            frame_cache[source_mod.id] = frame

            # Process frames and save them to a frame cache
            process_pipeline_frame(frame_cache, processing_nodes, module_map)

            # Compute quality metrics
            if len(result_modules) == 1:
                processed_frame = frame_cache[result_modules[0].source[0]]
                if original_frame.shape == processed_frame.shape:
                    metrics.append(compute_metrics(original_frame, processed_frame))
                else:
                    error_msg = "Original and processed frames must match in size for metric comparison"
                    metrics.append(Metrics(message=error_msg, psnr=None, ssim=None))
                output_queues["original"].append(original_frame)
                output_queues[result_modules[0].id].append(processed_frame)

            elif len(result_modules) == 2:
                f1 = frame_cache[result_modules[0].source[0]]
                f2 = frame_cache[result_modules[1].source[0]]
                if f1.shape == f2.shape:
                    metrics.append(compute_metrics(f1, f2))
                else:
                    error_msg = (
                        "Result frames must be the same size for metric comparison"
                    )
                    metrics.append(Metrics(message=error_msg, psnr=None, ssim=None))
                output_queues[result_modules[0].id].append(f1)
                output_queues[result_modules[1].id].append(f2)

        outputs: list[dict[str, str]] = []

        # Write standard result videos
        for result_mod in result_modules:
            mod_instance, params = module_map[result_mod.id]

            # Create video file name
            unique_id = uuid.uuid4()
            filename_base64 = (
                base64.urlsafe_b64encode(unique_id.bytes).decode("utf-8").rstrip("=")
            )
            filename = f"{source_file}-{filename_base64}.webm"

            params["path"] = filename
            params["fps"] = fps

            # Pass frames from the queue
            mod_instance.process(iter(output_queues[result_mod.id]), params)
            outputs.append({"video_player": params["video_player"], "path": filename})

        # Write interleaved video output
        interleaved_mod = ModuleRegistry.get_by_spacename(ModuleName.RESULT)
        interleaved_params = {
            "path": f"{source_file}-interleaved.webm",
            "fps": fps,
            "video_player": "interleaved",
        }

        def interleaved_generator():
            if len(result_modules) == 1:
                left_frames = output_queues["original"]
                right_frames = output_queues[result_modules[0].id]
            else:
                # Determine left/right by video_player param
                left_mod = right_mod = None
                for mod in result_modules:
                    side = module_map[mod.id][1].get("video_player", "")
                    if side == "left":
                        left_mod = mod.id
                    elif side == "right":
                        right_mod = mod.id
                if left_mod is None:
                    left_mod = result_modules[0].id
                if right_mod is None:
                    right_mod = result_modules[1].id
                left_frames = output_queues[left_mod]
                right_frames = output_queues[right_mod]

            while left_frames and right_frames:
                yield left_frames.popleft()
                yield right_frames.popleft()

        interleaved_mod.process(interleaved_generator(), interleaved_params)
        outputs.append(
            {"video_player": "interleaved", "path": interleaved_params["path"]}
        )

        output_map = {entry["video_player"]: entry["path"] for entry in outputs}
        response = PipelineResponse(
            left=output_map.get("left", ""),
            right=output_map.get("right", ""),
            interleaved=output_map.get("interleaved", ""),
            metrics=metrics,
        )
        return response
