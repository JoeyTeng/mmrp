from pydantic import BaseModel


class PipelineParameter(BaseModel):
    key: str
    value: int | float | str | bool


class PipelineModule(BaseModel):
    id: int
    name: str
    source: list[int]  # list of preceding module(s)
    parameters: list[PipelineParameter]


class PipelineRequest(BaseModel):
    modules: list[PipelineModule]
