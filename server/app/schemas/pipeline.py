from pydantic import BaseModel

class PipelineParameter(BaseModel):
    key: str
    value: str


class PipelineModule(BaseModel):
    id: int
    name: str
    source: list[int]  # list of preceding module(s)
    parameters: list[PipelineParameter]


class PipelineRequest(BaseModel):
    video: str
    modules: list[PipelineModule]
