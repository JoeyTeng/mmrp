from fastapi import APIRouter
from typing import List, Dict
from collections import defaultdict, deque
from app.schemas.pipeline import PipelineRequest, PipelineModule

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"],
    responses={404: {"description": "Not Found"}},
)


@router.post("/", response_model=List[str])
def process_pipeline(request: PipelineRequest):
    selected_video = request.video
    #
    #   Get video frames
    #
    ordered_modules = get_execution_order(request.modules)
    # 
    #   Process each frame in order 
    #
    return [mod.name for mod in ordered_modules]


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
                    raise ValueError(f"Pipeline contains an invalid reference: {dep_id}")
                graph[dep_id].append(mod.id)

    # Start with modules that have no dependencies
    queue: deque[int] = deque([module_id for module_id, degree in indegree.items() if degree == 0])
    execution_order: list[PipelineModule] = []

    while queue:
        current_id = queue.popleft()
        execution_order.append(module_map[current_id])

        for dependent_id in graph[current_id]:
            indegree[dependent_id] -= 1
            if indegree[dependent_id] == 0:
                queue.append(dependent_id)

    remaining_with_deps = [module_id for module_id, degree in indegree.items() if degree > 0]
    if remaining_with_deps:
        raise ValueError(f"Pipeline contains a cycle involving module IDs: {remaining_with_deps}")

    return execution_order