from fastapi import APIRouter
from typing import List, Dict
from collections import defaultdict, deque
from app.schemas.pipeline import PipelineRequest, PipelineModule
from app.routers.module import registry
from app.utils.shared_functionality import get_video_path

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"],
    responses={404: {"description": "Not Found"}},
)

# Endpoint to execute a video pipeline
@router.post("/", response_model=List[str])
def process_pipeline(request: PipelineRequest):
    selected_video = request.video
    ordered_modules = get_execution_order(request.modules)
    video_path = get_video_path(selected_video)
    # Process video for each module
    for mod in ordered_modules:
        # Look up module in registry
        module = registry.get(mod.name)
        if not module:
            raise ValueError(f"Module '{mod.name}' not found in registry")
        # Instantiate the class
        module_instance = module()
        # Convert parameter list to dict
        param_dict = {param.key: param.value for param in mod.parameters}
        # Process video
        video_path = module_instance.process(video_path, param_dict)
    return [mod.name for mod in ordered_modules]


# Get modules in correct order in the pipeline
def get_execution_order(modules: List[PipelineModule]):
    # Map module id → module
    module_map: Dict[int, PipelineModule] = {mod.id: mod for mod in modules}
    all_module_ids = set(module_map.keys())

    # Build the dependency graph (adjacency list of dependent ids)
    graph = defaultdict(list)

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
