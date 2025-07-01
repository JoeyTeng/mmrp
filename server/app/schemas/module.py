from pydantic import BaseModel
from typing import Literal, Optional, Any
from enum import Enum


class ModuleRole(str, Enum):
    INPUTNODE = "inputNode"
    PROCESSNODE = "processNode"
    OUTPUTNODE = "outputNode"


class ModuleParameter(BaseModel):
    name: str
    type: Literal["int", "float", "str", "bool"]
    description: Optional[str] = None
    default: Optional[Any] = None
    valid_values: Optional[tuple[Any, Any] | list[Any]] = None
    required: bool = True


class ModuleFormat(BaseModel):
    pixel_format: Optional[Literal["bgr24", "rgb24", "gray8"]] | str = None
    color_space: Optional[Literal["sRGB", "BT.709", "BT.2020"]] | str = None
    width: Optional[int] | str = None
    height: Optional[int] | str = None
    frame_rate: Optional[float] | str = None


class Module(BaseModel):
    id: int
    name: str
    role: ModuleRole
    parameters: list[ModuleParameter]
    input_formats: list[ModuleFormat]
    output_formats: list[ModuleFormat]
