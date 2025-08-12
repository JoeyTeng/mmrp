from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Any
from app.modules.utils.enums import Color, ColorSpace, FrameRate, PixelFormat


class ModuleFormat(BaseModel):
    pixel_format: list[PixelFormat] = Field(default_factory=list[PixelFormat])
    color_space: list[ColorSpace] = Field(default_factory=list[ColorSpace])
    color: Color | None = None
    width: int | None = Field(default=None, ge=32, le=3840, description="Output width")
    height: int | None = Field(
        default=None, ge=32, le=2160, description="Output height"
    )
    frame_rate: FrameRate | None = Field(
        default=None, description="Frame rate of the video format"
    )


class Position(BaseModel):
    x: float = Field(0.0, ge=0, description="X coordinate in workspace")
    y: float = Field(0.0, ge=0, description="Y coordinate in workspace")


# TODO: Make this Generic so the default value will be correctly typed
#       Reference: https://docs.pydantic.dev/latest/concepts/models/#generic-models
class ParameterConstraint(BaseModel):
    type: str = Field(..., description="Parameter type")
    default: Any | None = None
    min: float | None = None
    max: float | None = None
    options: list[str] | None = None
    required: bool = True
    description: str | None = None

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    @model_validator(mode="before")
    def set_default(cls, values: dict[str, Any]) -> dict[str, Any]:
        param_type = values.get("type", "str")
        if "default" not in values:
            values["default"] = cls._get_type_default(param_type)
        if "options" in values and values.get("options") is not None:
            values["type"] = "select"
        return values

    @staticmethod
    def _get_type_default(param_type: str) -> Any:
        type_defaults: dict[str, Any] = {
            "str": "",
            "int": 0,
            "float": 0.0,
            "bool": False,
            "select": "",
        }
        return type_defaults.get(param_type.lower(), None)

    # TODO: Function can be updated as needed
    def __getitem__(self, key: str) -> Any:
        return self.get_value_by_key(key)

    def get_value_by_key(self, key: str) -> Any:
        if hasattr(self, key):
            return getattr(self, key)
        raise KeyError(f"No such constraint field: {key}")


class ParameterMetadata(BaseModel):
    value: Any = Field(..., description="Parameter value")
    type: str = Field(..., description="Parameter type")
    constraints: ParameterConstraint | None = Field(
        None, description="Constraints for the parameter"
    )
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class ModuleParameter(BaseModel):
    name: str = Field(..., description="Parameter name")
    metadata: ParameterMetadata = Field(
        ..., description="Parameter Metadata for the parameter"
    )

    # Allow these extra fields for binary upload defined in the config
    flag: str | None = None  # Command-line flag
    options: list[str | int] | None = None  # Options for select parameters

    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class ModuleData(BaseModel):
    name: str = Field(..., description="Module name in pipeline")
    module_class: str = Field(..., description="Module Class name")
    parameters: list[ModuleParameter] = Field(
        default=[], description="List of data paramaters"
    )
    input_formats: list[ModuleFormat] | None = Field(
        default=None, description="List of input formats"
    )
    output_formats: list[ModuleFormat] | None = Field(
        default=None, description="List of output formats"
    )

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    @model_validator(mode="before")
    def parse_raw_parameters(cls, values: dict[str, Any]) -> dict[str, Any]:
        parameters_ = values.get("parameters", [])

        enriched_parameters: list[ModuleParameter] = []
        for param_ in parameters_:
            # TODO - Find a better logic to handle this
            #       in a better way.
            if param_["name"].lower() in {"input", "output"}:
                continue
            # Validate and enrich parameter constraints
            constraint_ = ParameterConstraint.model_validate(param_)

            # Metadata for the parameter
            metadata_ = ParameterMetadata(
                type=param_["type"],
                value=param_.get("default", constraint_.default),
                constraints=constraint_,
            )

            # Parameter
            parameter_ = ModuleParameter(name=param_["name"], metadata=metadata_)
            enriched_parameters.append(parameter_)

        values["parameters"] = enriched_parameters
        return values

    def get(self, key: str) -> Any:
        return getattr(self, key)


class VideoSourceParams(BaseModel):
    path: str = Field(..., description="Path to video file")


class ColorspaceParams(BaseModel):
    input_colorspace: str = Field(..., description="Input color space")
    output_colorspace: str = Field(..., description="Output color space")


class BlurParams(BaseModel):
    kernel_size: int = Field(..., ge=1, le=31, description="Kernel size (must be odd)")
    method: str = Field(..., description="Blur algorithm type")

    @field_validator("kernel_size")
    def validate_kernel_odd(cls, v: int) -> int:
        if v % 2 == 0:
            raise ValueError("Kernel size must be odd")
        return v


class ResizeParams(BaseModel):
    width: int = Field(..., ge=32, le=3840, description="Output width")
    height: int = Field(..., ge=32, le=2160, description="Output height")
    interpolation: str = Field(..., description="Interpolation method")


class VideoOutputParams(BaseModel):
    video_player: str = Field(..., description="Output file path")
    # codec: str | None = Field(None, description="Video codec")
    # quality: int | None = Field(23, ge=0, le=51, description="Quality level")


# Binaries can have any parameters, so we need a generic model
class GenericParameterModel(BaseModel):
    class Config:
        extra = "allow"


class VideoCodecParams(BaseModel):
    """Common video encoding parameters shared across different codec implementations.

    This base class defines standard video compression settings that are generally
    applicable to most modern codecs (H.264/AVC, HEVC, VP9, etc.). Individual codec
    implementations should extend this class to add codec-specific parameters.

    Attributes:
        codec: Video compression standard (e.g., 'h264', 'hevc', 'vp9')
        bitrate: Target bitrate in kbps (100-50000)
        gop_size: Group-of-pictures size (0=auto)
    """

    codec: str = Field(..., description="Video codec (e.g., h264, hevc, vp9)")
    bitrate: int | None = Field(None, ge=100, le=50000, description="Bitrate in kbps")
    gop_size: int | None = Field(None, ge=0, description="Group of pictures size")
