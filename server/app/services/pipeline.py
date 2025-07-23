import numpy as np
from collections import defaultdict, deque
from typing import Any, Iterator, Dict, List
from app.modules.module import ModuleBase
from app.schemas.pipeline import PipelineModule
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.module import registry
from itertools import tee
import uuid
import base64
# from app.modules.utils.models import ModuleParameter


# Validate pipeline parameters
# Helper
def _is_type_match(value: Any, expected_type: str) -> bool:
    type_map: Dict[str, type] = {"int": int, "float": float, "str": str, "bool": bool}
    if expected_type not in type_map:
        raise ValueError(f"Unknown expected type '{expected_type}'")

    return isinstance(value, type_map[expected_type])


def validate_parameters(
    parameters: Dict[str, Any],
    parameter_defs: Dict[str, Any],
    module: ModuleBase,
) -> None:
    # Check for unexpected parameters
    for key, value in parameters.items():
        if key not in parameter_defs:
            raise ValueError(f"Unexpected parameter '{key}' for module '{module.name}'")

        param_def = parameter_defs[key]
        expected_type = param_def.type
        if not _is_type_match(value, expected_type):
            raise TypeError(
                f"Parameter '{key}' for module '{module.name}' should be of type '{expected_type}', "
                f"but got value '{value}' ({type(value).__name__})"
            )

    # Check for missing required parameters
    for param_name, param_def in parameter_defs.items():
        if param_def.required and param_name not in parameters:
            raise ValueError(
                f"Missing required parameter '{param_name}' for module '{module.name}'"
            )


# Process a single frame through the pipeline
def process_pipeline_frame(
    frame_cache: Dict[int, np.ndarray],
    ordered_modules: List[PipelineModule],
    module_map: Dict[int, tuple[ModuleBase, Dict[str, Any]]],
) -> None:
    for mod in ordered_modules:
        mod_id = mod.id
        mod_instance, params = module_map[mod_id]

        input_frames = [frame_cache[src_id] for src_id in (mod.source or [0])]
        frame_output = mod_instance.process_frame(input_frames[0], params)
        frame_cache[mod_id] = frame_output


# Get modules in correct execution order in the pipeline
def get_execution_order(modules: List[PipelineModule]) -> List[PipelineModule]:
    # Map module id -> module
    module_map: Dict[int, PipelineModule] = {mod.id: mod for mod in modules}
    all_module_ids = set(module_map.keys())

    # Build the dependency graph (adjacency list of dependent ids)
    graph: defaultdict[int, List[int]] = defaultdict(list)

    # Tracks how many dependecies each module has
    indegree = {mod.id: len(mod.source) for mod in modules}

    for mod in modules:
        if mod.source:
            for dep_id in mod.source:
                if dep_id not in all_module_ids:
                    raise ValueError(
                        f"Pipeline contains an invalid reference: {dep_id}"
                    )
                graph[dep_id].append(mod.id)

    # Start with modules that have no dependencies
    queue: deque[int] = deque(
        [module_id for module_id, degree in indegree.items() if degree == 0]
    )
    execution_order: List[PipelineModule] = []

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


# Handle the pipeline request and process the video
def handle_pipeline_request(request: PipelineRequest) -> PipelineResponse:
    # Resolve pipeline modules
    ordered_modules: list[PipelineModule] = get_execution_order(request.modules)
    # Check that the pipeline starts with a source module
    if not ordered_modules or ordered_modules[0].name != "video_source":
        raise ValueError("Pipeline must start with a video_source module")
    if ordered_modules[-1].name != "result":
        raise ValueError("Pipeline must end with a result module")

    # Registry lookup
    module_map: Dict[int, tuple[ModuleBase, Dict[str, Any]]] = {
        m.id: (registry[m.name](), {p.key: p.value for p in m.parameters})
        for m in ordered_modules
    }

    # Validate module parameters
    for mod in ordered_modules:
        mod_id = mod.id
        mod_instance, params = module_map[mod_id]
        # Get expected parameter definitions
        param_defs: Dict[str, Any] = {
            name: param for name, param in mod_instance.get_parameters().items()
        }
        # Validate each parameter
        validate_parameters(params, param_defs, mod_instance)

    # Get source and result module
    source_mod = ordered_modules[0]
    result_modules = [module for module in ordered_modules if module.name == "result"]

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
        m for m in ordered_modules if m.name not in {"source", "result"}
    ]

    # Source module processes video input and yields framerate
    with module_map[source_mod.id][0].process(None, module_map[source_mod.id][1]) as (
        source_file,
        fps,
        frame_iter,
    ):
        # Run frames through whole pipeline and return the frames that need to be written
        def base_pipeline_iterator() -> Iterator[tuple[int, np.ndarray]]:
            frame_cache: dict[int, np.ndarray] = {}
            for frame in frame_iter:
                frame_cache.clear()
                frame_cache[source_mod.id] = frame
                # Process frames and save them to a frame cache
                process_pipeline_frame(frame_cache, processing_nodes, module_map)
                for result_mod in result_modules:
                    for sid in result_mod.source:
                        # Yield the result module and the corresponding frames to be written
                        yield (result_mod.id, frame_cache[sid])

        # Create two iterators for the result modules that can read from the data stream independently
        piped_iters = tee(base_pipeline_iterator(), len(result_modules))

        outputs: list[dict[str, str]] = []

        # Result module(s) write the output video file(s)
        for result_mod, mod_iter in zip(result_modules, piped_iters):
            mod_instance, params = module_map[result_mod.id]

            # Create video file name
            unique_id = uuid.uuid4()
            filename_base64 = (
                base64.urlsafe_b64encode(unique_id.bytes).decode("utf-8").rstrip("=")
            )
            filename = f"{source_file}-{filename_base64}.webm"

            params["path"] = filename
            params["fps"] = fps

            # Pass only the frames for the specific result module
            def filtered_iter(
                mod_id: int, it: Iterator[tuple[int, np.ndarray]]
            ) -> Iterator[np.ndarray]:
                for mid, frame in it:
                    if mid == mod_id:
                        yield frame

            mod_instance.process(filtered_iter(result_mod.id, mod_iter), params)

            # Return the video player side and video file name
            outputs.append({"video_player": params["video_player"], "path": filename})

    output_map = {entry["video_player"]: entry["path"] for entry in outputs}
    response = PipelineResponse(
        left=output_map.get("left", ""), right=output_map.get("right", "")
    )
    return response
