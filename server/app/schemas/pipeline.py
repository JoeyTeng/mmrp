from pydantic import BaseModel
from app.schemas.metrics import Metrics
from app.schemas.module import ModuleData


class PipelineParameter(BaseModel):
    key: str
    value: int | float | str | bool


class PipelineModule(BaseModel):
    id: str
    name: str
    module_class: str
    source: list[str]  # list of preceding module(s)
    parameters: list[PipelineParameter]


class PipelineRequest(BaseModel):
    modules: list[PipelineModule]


class PipelineResponse(BaseModel):
    left: str
    right: str
    metrics: list[Metrics]


class NodeSpec(BaseModel):
    id: str
    module_class: str
    name: str
    type: str
    position: dict[str, float]
    data: ModuleData


class EdgeSpec(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str
    targetHandle: str


class ExamplePipeline(BaseModel):
    id: str
    name: str
    nodes: list[NodeSpec]
    edges: list[EdgeSpec]
