from typing import Any
from app.schemas.module import ParameterConstraint
from app.modules.utils.enums import (
    Color,
    ModuleName,
    ParameterType,
    BlurAlgorithm,
    ResizeInterpolation,
    VideoCodec,
)

MODULE_CONSTRAINTS: dict[str, Any] = {
    ModuleName.VIDEO_SOURCE: {
        "path": {
            "constraints": ParameterConstraint(
                type=ParameterType.STRING,
                default="example-video.mp4",
                required=True,
                description="Input file path",
            )
        },
        "fps": {
            "constraints": ParameterConstraint(
                type=ParameterType.INTEGER,
                default=30,
                min=1,
                max=120,
                description="Frames per second",
            )
        },
    },
    ModuleName.COLOR: {
        "input_colorspace": {
            "constraints": ParameterConstraint(
                type=ParameterType.SELECT,
                default=Color.RGB,
                options=[color.value for color in Color],
                description="Input color space",
            )
        },
        "output_colorspace": {
            "constraints": ParameterConstraint(
                type=ParameterType.SELECT,
                default=Color.RGB,
                options=[color.value for color in Color],
                description="Output color space",
            )
        },
    },
    ModuleName.BLUR: {
        "kernel_size": {
            "constraints": ParameterConstraint(
                type=ParameterType.INTEGER,
                default=5,
                min=1,
                max=31,
                description="Kernel size (must be odd)",
            )
        },
        "method": {
            "constraints": ParameterConstraint(
                type=ParameterType.SELECT,
                default=BlurAlgorithm.GAUSSIAN,
                options=[b.value for b in BlurAlgorithm],
                description="Blur algorithm type",
            )
        },
    },
    ModuleName.RESIZE: {
        "width": {
            "constraints": ParameterConstraint(
                type=ParameterType.INTEGER,
                default=640,
                min=32,
                max=3840,
                required=True,
                description="Output width in pixels",
            )
        },
        "height": {
            "constraints": ParameterConstraint(
                type=ParameterType.INTEGER,
                default=480,
                min=32,
                max=2160,
                required=True,
                description="Output height in pixels",
            )
        },
        "interpolation": {
            "constraints": ParameterConstraint(
                type=ParameterType.SELECT,
                default=ResizeInterpolation.LINEAR,
                options=[b.value for b in ResizeInterpolation],
                description="Interpolation method",
            )
        },
    },
    ModuleName.RESULT: {
        "path": {
            "constraints": ParameterConstraint(
                type=ParameterType.STRING,
                default="output.mp4",
                required=True,
                description="Output file path",
            )
        },
        "codec": {
            "constraints": ParameterConstraint(
                type=ParameterType.SELECT,
                default=VideoCodec.LIBX264,
                options=[vc.value for vc in VideoCodec],
                description="Video codec",
            )
        },
        "quality": {
            "constraints": ParameterConstraint(
                type=ParameterType.INTEGER,
                default=23,
                min=0,
                max=51,
                description="Quality level (lower is better)",
            )
        },
    },
    # Add constraints for other modules...
}
