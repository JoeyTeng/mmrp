from pydantic import BaseModel
from typing import Literal, Optional, Any

class ModuleParameter(BaseModel):
    name: str
    type: Literal["int", "float", "str", "bool"]
    description: Optional[str] = None
    default: Optional[Any] = None
    min: Optional[float] = None
    max: Optional[float] = None
    choices: Optional[list[Any]] = None
    required: bool = True

class Module(BaseModel):
    id: int
    name: str
    parameters: list[ModuleParameter]