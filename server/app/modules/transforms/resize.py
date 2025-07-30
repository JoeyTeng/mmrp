import cv2
from typing import Any, override
from pathlib import Path
import numpy as np
from app.modules.module import ModuleBase
from app.utils.shared_functionality import as_context
from app.schemas.module import ModuleFormat, ModuleParameter, ResizeParams
from app.modules.utils.enums import (
    PixelFormat,
    ColorSpace,
    FrameRate,
    ResizeInterpolation,
)


class ResizeModule(ModuleBase):
    parameter_model: Any = ResizeParams

    @override
    def get_parameters(self) -> list[ModuleParameter]:
        return self.data.parameters

    @override
    def get_input_formats(self) -> list[ModuleFormat]:
        return [
            ModuleFormat(
                pixel_format=PixelFormat.BGR24, color_space=ColorSpace.BT_709_FULL
            )
        ]

    @override
    def get_output_formats(self) -> list[ModuleFormat]:
        return [
            ModuleFormat(
                pixel_format=PixelFormat.BGR24,
                color_space=ColorSpace.BT_709_FULL,
                width=32,
                height=1024,
                frame_rate=FrameRate.FPS_30,
            )
        ]

    @override
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, Any]
    ) -> np.ndarray[Any]:
        width: int = parameters["width"]
        height: int = parameters["height"]
        new_size: tuple[int, int] = (width, height)
        interpolation: str = parameters["interpolation"]
        interpolation_type: int = self.match_interpolation_type(interpolation)
        return cv2.resize(frame, new_size, interpolation=interpolation_type)

    def match_interpolation_type(self, interpolation: str) -> int:
        match interpolation:
            case ResizeInterpolation.NEAREST:
                return cv2.INTER_NEAREST_EXACT
            case ResizeInterpolation.LINEAR:
                return cv2.INTER_LINEAR_EXACT
            case ResizeInterpolation.CUBIC:
                return cv2.INTER_CUBIC
            case ResizeInterpolation.AREA:
                return cv2.INTER_AREA
            case ResizeInterpolation.LANCZOS4:
                return cv2.INTER_LANCZOS4
            case _:
                raise ValueError(f"Unsupported interpolation type: {interpolation}")

    @override
    def process(self, input_data: str, parameters: dict[str, Any]) -> None:
        width: int = parameters["width"]
        height: int = parameters["height"]
        new_size: tuple[int, int] = (width, height)
        output_path: str = str(
            Path(__file__).resolve().parent.parent.parent
            / "output"
            / f"resize_{width}_{height}.webm"
        )

        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())
        cv2VideoWriterContext = as_context(cv2.VideoWriter, lambda cap: cap.release())
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*"VP80")

        with cv2VideoCaptureContext(input_data) as cap:
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {input_data}")
            fps = cap.get(cv2.CAP_PROP_FPS)

            with cv2VideoWriterContext(output_path, fourcc, fps, new_size) as out:
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    output_frame = self.process_frame(frame, parameters)
                    out.write(output_frame)
