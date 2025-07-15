from pydantic import BaseModel
from typing import Literal, Optional, Any
from app.utils.enums import ModuleRole, PixelFormats, ColorSpaces


class ModuleParameter(BaseModel):
    name: str
    type: Literal["int", "float", "str", "bool"]
    description: Optional[str] = None
    default: Optional[Any] = None
    constraints: Optional[tuple[Any, Any] | list[Any]] = None
    required: bool = True


class ModuleFormat(BaseModel):
    pixel_format: Optional[PixelFormats] | str = None
    color_space: Optional[ColorSpaces] | str = None
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
