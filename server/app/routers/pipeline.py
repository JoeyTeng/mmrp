import cv2
from fastapi import APIRouter
from typing import List, Dict
from pathlib import Path
from collections import defaultdict, deque
from app.schemas.pipeline import PipelineRequest, PipelineModule
from app.routers.module import registry
from app.utils.shared_functionality import get_video_path, as_context
from app.modules.base_module import ModuleBase

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"],
    responses={404: {"description": "Not Found"}},
)

# Endpoint to execute a video pipeline frame by frame
@router.post("/", response_model=bool)
def process_pipeline(request: PipelineRequest):
    try:
        # Get video and pipeline
        selected_video: str = request.video
        modules: list[PipelineModule] = request.modules
        ordered_modules: list[PipelineModule] = get_execution_order(modules)
        video_path: str = str(get_video_path(selected_video))

        # Registry lookup
        module_map: dict[int, tuple[ModuleBase, dict[str, str]]] = {
            m.id: (registry[m.name](), {p.key: p.value for p in m.parameters}) for m in modules
        }

        # Identify end modules (no children)
        end_modules: set[int] = {m.id for m in modules} - {d for m in modules for d in (m.source or [])}

        # Output path
        output_path = Path(__file__).resolve().parent.parent.parent / "output" / f"{selected_video}_output.mp4"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Context wrappers
        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())
        cv2VideoWriterContext = as_context(cv2.VideoWriter, lambda writer: writer.release())
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*'mp4v')

        with cv2VideoCaptureContext(video_path) as cap:
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {video_path}")
            fps = cap.get(cv2.CAP_PROP_FPS)

            # Read and prcoess first frame to get correct dimensions for writer
            ret, first_frame = cap.read()
            if not ret:
                raise ValueError("Could not read first frame")

            # Process first frame
            frame_cache = {0: first_frame}
            for mod in ordered_modules:
                mod_id = mod.id
                mod_instance, params = module_map[mod_id]
                input_frames = [frame_cache[src_id] for src_id in (mod.source or [0])]
                frame_output = mod_instance.process_frame(input_frames[0], params)
                frame_cache[mod_id] = frame_output

            final_outputs = [frame_cache[mid] for mid in end_modules]
            out_height, out_width = final_outputs[0].shape[:2]

            output_path.parent.mkdir(parents=True, exist_ok=True)
            out_path = str(output_path)

            # Initialise output writer with dimensions from processed first frame
            with cv2VideoWriterContext(out_path, fourcc, fps, (out_width, out_height)) as out:
                # Write the first frame(s)
                for out_frame in final_outputs:
                    out.write(out_frame)

                # Continue processing and writing remaining frames
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break

                    frame_cache = {0: frame}
                    for mod in ordered_modules:
                        mod_id = mod.id
                        mod_instance, params = module_map[mod_id]
                        input_frames = [frame_cache[src_id] for src_id in (mod.source or [0])]
                        frame_output = mod_instance.process_frame(input_frames[0], params)
                        frame_cache[mod_id] = frame_output

                    for out_frame in [frame_cache[mid] for mid in end_modules]:
                        out.write(out_frame)

        cap.release()
        out.release()
        return True

    except Exception as e:
        print(f"Pipeline processing error: {e}")
        return False


# Get modules in correct execution order in the pipeline
def get_execution_order(modules: List[PipelineModule]):
    # Map module id → module
    module_map: Dict[int, PipelineModule] = {mod.id: mod for mod in modules}
    all_module_ids = set(module_map.keys())

    # Build the dependency graph (adjacency list of dependent ids)
    graph: defaultdict[int, list[int]] = defaultdict(list)

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
