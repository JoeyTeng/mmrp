from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional, Any, Union, Dict
from app.modules.utils.enums import Color, ColorSpace, FrameRate, PixelFormat


class ModuleFormat(BaseModel):
    pixel_format: Optional[PixelFormat] = None
    color_space: Optional[ColorSpace] = None
    color: Optional[Color] = None
    width: Optional[Union[int, str]] = None
    height: Optional[Union[int, str]] = None
    frame_rate: Optional[FrameRate] = None


class Position(BaseModel):
    x: float = Field(0.0, ge=0, description="X coordinate in workspace")
    y: float = Field(0.0, ge=0, description="Y coordinate in workspace")


class ParameterConstraint(BaseModel):
    type: str = Field(..., description="Parameter type")
    default: Any = Field(..., description="Default value for the parameter")
    min: Optional[float] = None
    max: Optional[float] = None
    options: Optional[List[str]] = None
    required: bool = True
    description: Optional[str] = None

    @model_validator(mode="before")
    def set_default(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        param_type = values.get("type", "str")
        if "default" not in values:
            values["default"] = cls._get_type_default(param_type)
        return values

    @staticmethod
    def _get_type_default(param_type: str) -> Any:
        type_defaults = {"str": "", "int": 0, "float": 0.0, "bool": False, "select": ""}
        return type_defaults.get(param_type.lower(), None)

    def model_dump(self, **kwargs: Any) -> Dict[str, Any]:
        kwargs.setdefault("exclude_none", True)
        return super().model_dump(**kwargs)

    def get_value_by_key(self, key: str) -> Any:
        if hasattr(self, key):
            return getattr(self, key)
        raise KeyError(f"No such constraint field: {key}")


class ParameterMetadata(BaseModel):
    value: Any = Field(..., description="Parameter value")
    type: str = Field(..., description="Parameter type")
    constraints: Optional[ParameterConstraint] = Field(
        None, description="Constraints for the parameter"
    )

    def model_dump(self, **kwargs: Any) -> Dict[str, Any]:
        kwargs.setdefault("exclude_none", True)
        return super().model_dump(**kwargs)


class ModuleParameter(BaseModel):
    name: str = Field(..., description="Parameter name")
    metadata: ParameterMetadata = Field(
        ..., description="Parameter Metadata for the parameter"
    )

    def model_dump(self, **kwargs: Any) -> Dict[str, Any]:
        kwargs.setdefault("exclude_none", True)
        return super().model_dump(**kwargs)


class VideoSourceParams(ModuleParameter):
    path: str = Field(..., description="Path to video file")


class ColorspaceParams(ModuleParameter):
    input_colorspace: str = Field(..., description="Input color space")
    output_colorspace: str = Field(..., description="Output color space")


class BlurParams(ModuleParameter):
    kernel_size: int = Field(..., ge=1, le=31, description="Kernel size (must be odd)")
    method: str = Field(..., description="Blur algorithm type")

    @field_validator("kernel_size")
    def validate_kernel_odd(cls, v: int) -> int:
        if v % 2 == 0:
            raise ValueError("Kernel size must be odd")
        return v


class ResizeParams(ModuleParameter):
    width: int = Field(..., ge=32, le=3840, description="Output width")
    height: int = Field(..., ge=32, le=2160, description="Output height")
    interpolation: str = Field(..., description="Interpolation method")


class VideoOutputParams(ModuleParameter):
    path: str = Field(..., description="Output file path")
    # codec: Optional[str] = Field(None, description="Video codec")
    # quality: Optional[int] = Field(23, ge=0, le=51, description="Quality level")


class VideoCodecParams(ModuleParameter):
    codec: str = Field(..., description="Video codec (e.g., h264, hevc, vp9)")
    bitrate: Optional[int] = Field(
        None, ge=100, le=50000, description="Bitrate in kbps"
    )
    gop_size: Optional[int] = Field(None, ge=0, description="Group of pictures size")
