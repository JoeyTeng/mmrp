from pydantic import BaseModel
from typing import List, Optional

class PipelineParameter(BaseModel):
    key: str
    value: str

class PipelineModule(BaseModel):
    id: int
    name: str
    source: Optional[List[int]] = None
    parameters: List[PipelineParameter]

class PipelineRequest(BaseModel):
    video: str
    modules: List[PipelineModule]