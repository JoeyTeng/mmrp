import re
import time
import numpy as np
from typing import Any, Iterator
from pydantic import ValidationError
from app.modules.module import ModuleBase
from app.schemas.pipeline import PipelineModule
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.module_registry import ModuleRegistry
import uuid
from app.utils.quality_metrics import compute_metrics, compute_metrics_yuv_luma_series
from app.schemas.metrics import Metrics
from app.modules.utils.enums import ModuleName
from pathlib import Path
from app.schemas.pipeline import ExamplePipeline
import json
from app.utils.shared_functionality import (
    create_filename_base,
    encode_video,
    get_execution_order,
    get_video_path,
)
from app.schemas.video import VideoMetadata
from app.modules.generic.binary_module import GenericBinaryModule

EXAMPLES_DIR = Path(__file__).parent.parent / "db/examples"
WORK_DIR = Path(__file__).parent.parent / "output" / "work"
WORK_DIR.mkdir(parents=True, exist_ok=True)


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


# Process mp4 videos (bgr colorspace) frame by frame as numpy arrays
def process_video_frames(
    module_map: dict[str, tuple[ModuleBase, dict[str, Any]]],
    source_mod: PipelineModule,
    result_modules: list[PipelineModule],
    processing_nodes: list[PipelineModule],
) -> PipelineResponse:
    with module_map[source_mod.id][0].process(None, module_map[source_mod.id][1]) as (
        source_file,
        fps,
        frame_iter,
    ):
        # Frame storage of original frames
        original_frames: list[np.ndarray] = []
        # Frame storage per result module
        result_frames: dict[str, list[np.ndarray]] = {
            mod.id: [] for mod in result_modules
        }

        # Run frames through whole pipeline and return the frames that need to be written
        def base_pipeline_iterator() -> Iterator[tuple[str, np.ndarray]]:
            frame_cache: dict[str, np.ndarray] = {}
            for frame in frame_iter:
                original_frames.append(frame.copy())
                frame_cache.clear()
                frame_cache[source_mod.id] = frame
                # Process frames and save them to a frame cache
                process_pipeline_frame(frame_cache, processing_nodes, module_map)
                for result_mod in result_modules:
                    for sid in result_mod.source:
                        # Yield the result module and the corresponding frames to be written
                        yield (result_mod.id, frame_cache[sid])

        for mod_id, frame in base_pipeline_iterator():
            result_frames[mod_id].append(frame)

        outputs: list[dict[str, str]] = []

        for result_mod in result_modules:
            mod_instance, params = module_map[result_mod.id]

            # Add output file name to parameters
            file = f"{create_filename_base(source_file)}.webm"
            params["path"] = file

            params["fps"] = fps

            # Pass only the frames for the specific result module
            def frame_iter_result() -> Iterator[np.ndarray]:
                yield from result_frames[result_mod.id]

            mod_instance.process(frame_iter_result(), params)

            # Return the video player side and video file name
            outputs.append({"video_player": params["video_player"], "path": file})

        output_map = {entry["video_player"]: entry["path"] for entry in outputs}

        # Frame-by-frame metrics
        metrics: list[Metrics] = []
        if len(result_modules) in (1, 2):
            if len(result_modules) == 1:
                frames1 = original_frames
                frames2 = result_frames[result_modules[0].id]
                error_msg = "Original and processed frames must match in size for metric comparison"
            else:
                frames1 = result_frames[result_modules[0].id]
                frames2 = result_frames[result_modules[1].id]
                error_msg = "Result frames must be the same size for metric comparison"

            for frame1, frame2 in zip(frames1, frames2):
                if frame1.shape != frame2.shape:
                    metrics.append(Metrics(message=error_msg, psnr=None, ssim=None))
                else:
                    m = compute_metrics(frame1, frame2)
                    metrics.append(m)

        response = PipelineResponse(
            left=output_map.get("left", ""),
            right=output_map.get("right", ""),
            metrics=metrics,
        )
        return response


# Process YUV videos (YUV420p colorspace)
def process_yuv_video(
    source_file: str,
    module_map: dict[str, tuple[ModuleBase, dict[str, Any]]],
    source_mod: PipelineModule,
    result_modules: list[PipelineModule],
    processing_nodes: list[PipelineModule],
) -> PipelineResponse:
    # Get path to input YUV file
    yuv_path = module_map[source_mod.id][0].process(None, module_map[source_mod.id][1])
    m = re.search(
        r"_(\d+)x(\d+)(?:_(\d+(?:\.\d+)?))?\.yuv$", source_file, flags=re.IGNORECASE
    )
    if not m:
        raise ValueError(
            f"YUV file '{source_file}' must encode size as '*_{{W}}x{{H}}[_{{FPS}}].yuv' "
            f"(e.g., 'vidyo1_640x360_60.yuv')."
        )
    w, h = int(m.group(1)), int(m.group(2))
    fps = float(m.group(3))
    print(f"Width of original: {w}, Height of original: {h}, FPS of original: {fps}")

    video_metadata = VideoMetadata(path=yuv_path, width=w, height=h, fps=fps)

    video_cache: dict[str, VideoMetadata] = {source_mod.id: video_metadata}
    for processing_node in processing_nodes:
        # Process the video through each binary
        module, params = module_map[processing_node.id]
        if not isinstance(module, GenericBinaryModule):
            raise ValueError("YUV processing nodes must be binary modules")
        # For now, we assume a single input for each processing node
        assert len(processing_node.source) == 1
        input = video_cache[processing_node.source[0]]

        output_path = WORK_DIR / f"{time.time()}-{uuid.uuid4().hex}.yuv"
        binary_input: dict[str, Any] = {
            "input": input.path,
            "width": input.width,
            "height": input.height,
            "fps": input.fps,
            "output": output_path,
        }

        video_cache[processing_node.id] = module.process(binary_input, params)

    outputs: list[dict[str, str]] = []
    for result in result_modules:
        assert len(result.source) == 1
        input_metadata = video_cache[result.source[0]]
        result_input = VideoMetadata(
            path=input_metadata.path,
            width=input_metadata.width,
            height=input_metadata.height,
            fps=input_metadata.fps,
        )
        result_mod, params = module_map[result.id]

        # Add video source file to parameters
        params["original"] = source_file
        # Add output path to parameters
        file = f"{create_filename_base(source_file)}.webm"
        params["path"] = file

        result_mod.process(result_input, params)

        outputs.append({"video_player": params["video_player"], "path": file})

    if len(result_modules) == 1:
        file_name = Path(source_file).stem
        original_out_path = (
            Path(__file__).resolve().parent.parent.parent.parent
            / "server"
            / "videos"
            / f"{file_name}.webm"
        )
        if not original_out_path.exists():
            encode_video(video_metadata, original_out_path)

        outputs.append({"video_player": "left", "path": str(original_out_path)})

    output_map = {entry["video_player"]: entry["path"] for entry in outputs}

    # Compute metrics
    metrics: list[Metrics] = []
    if len(result_modules) == 1:
        processed = video_cache[result_modules[0].source[0]]
        metrics = compute_metrics_yuv_luma_series(video_metadata, processed)
    elif len(result_modules) == 2:
        a = video_cache[result_modules[0].source[0]]
        b = video_cache[result_modules[1].source[0]]
        metrics = compute_metrics_yuv_luma_series(a, b)

    return PipelineResponse(
        left=output_map.get("left", ""),
        right=output_map.get("right", ""),
        metrics=metrics,
    )


# Handle the pipeline request (validation, execution order, processing)
def handle_pipeline_request(request: PipelineRequest) -> PipelineResponse:
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

    video_file = str(module_map[source_mod.id][1].get("path"))
    video_path = get_video_path(video_file)
    ext = video_path.suffix.lower()

    if ext == ".yuv":
        return process_yuv_video(
            video_file, module_map, source_mod, result_modules, processing_nodes
        )
    else:
        return process_video_frames(
            module_map, source_mod, result_modules, processing_nodes
        )


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
