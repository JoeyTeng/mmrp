from pydantic import BaseModel
from app.schemas.metrics import Metrics


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
