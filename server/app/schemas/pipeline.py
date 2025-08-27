from pydantic import BaseModel
from app.schemas.metrics import Metrics
from app.schemas.module import ModuleData
from pydantic import model_validator
from typing import Any


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
    interleaved: str
    metrics: list[Metrics]


class PipelineNodeData(ModuleData):
    """ModuleData for pipeline nodes"""

    # Override the validator to do nothing
    @model_validator(mode="before")
    def parse_raw_parameters(cls, values: dict[str, Any]) -> dict[str, Any]:
        return values  # No transformation needed


class PipelineNode(BaseModel):
    id: str
    type: str
    position: dict[str, float]
    data: PipelineNodeData
    sourcePosition: str
    targetPosition: str
    measured: dict[str, Any]
    selected: bool
    dragging: bool


class PipelineEdge(BaseModel):
    id: str
    source: str
    target: str
    markerEnd: dict[str, Any]
    interactionWidth: int


class ExamplePipeline(BaseModel):
    id: str
    name: str
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]
