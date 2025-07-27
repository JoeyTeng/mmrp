from pydantic import BaseModel


class PipelineParameter(BaseModel):
    key: str
    value: int | float | str | bool


class PipelineModule(BaseModel):
    id: str
    name: str
    source: list[str]  # list of preceding module(s)
    parameters: list[PipelineParameter]


class PipelineRequest(BaseModel):
    modules: list[PipelineModule]


class PipelineResponse(BaseModel):
    left: str
    right: str
