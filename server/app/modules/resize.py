import cv2
import typing
from pathlib import Path
from app.modules.base_module import (
    ModuleBase,
    ParameterDefinition,
    FormatDefinition,
    ModuleRole,
)
from app.utils.shared_functionality import as_context
import numpy as np


class Resize(ModuleBase):
    name = "resize"

    role = ModuleRole.PROCESS_NODE

    @typing.override
    # Get the parameters for the resize module
    def get_parameters(self) -> list[ParameterDefinition[typing.Any]]:
        return [
            ParameterDefinition(
                name="width", type="int", required=True, valid_values=(1, 4096)
            ),
            ParameterDefinition(
                name="height", type="int", required=True, valid_values=(1, 4096)
            ),
            ParameterDefinition(
                name="interpolation",
                type="str",
                required=True,
                valid_values=["nearest", "linear", "cubic", "area", "lanczos4"],
            ),
        ]

    @typing.override
    def get_input_formats(self) -> list[FormatDefinition]:
        return [FormatDefinition(pixel_format="bgr24", color_space="BT.709 Full")]

    @typing.override
    def get_output_formats(self) -> list[FormatDefinition]:
        # width/height will be resolved from parameters at runtime
        return [
            FormatDefinition(
                pixel_format=fmt.pixel_format,
                color_space=fmt.color_space,
                width="param:width",
                height="param:height",
                frame_rate=fmt.frame_rate,
            )
            for fmt in self.get_input_formats()
        ]

    @typing.override
    # Process a single frame
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, typing.Any]
    ) -> np.ndarray:
        width: int = parameters["width"]
        height: int = parameters["height"]
        new_size: tuple[int, int] = (width, height)
        interpolation: str = parameters["interpolation"]
        interpolation_type: int = self.match_interpolation_type(interpolation)
        return cv2.resize(frame, new_size, interpolation=interpolation_type)

    @typing.override
    # Process the entire video
    def process(self, input_data: str, parameters: dict[str, typing.Any]) -> None:
        width: int = parameters["width"]
        height: int = parameters["height"]
        new_size: tuple[int, int] = (width, height)
        output_path: str = str(
            Path(__file__).resolve().parent.parent.parent
            / "output"
            / f"resize_{width}_{height}.webm"
        )

        # Video capture setup
        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())

        # Video writer setup
        cv2VideoWriterContext = as_context(cv2.VideoWriter, lambda cap: cap.release())
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*"VP80")

        with cv2VideoCaptureContext(input_data) as cap:
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {input_data}")
            fps = cap.get(cv2.CAP_PROP_FPS)

            with cv2VideoWriterContext(output_path, fourcc, fps, new_size) as out:
                # Process and write frames
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    output_frame = self.process_frame(frame, parameters)
                    out.write(output_frame)

    # Match interpolation input to OpenCV constants
    def match_interpolation_type(self, interpolation: str) -> int:
        if kernel := dict(
            nearest=cv2.INTER_NEAREST_EXACT,
            linear=cv2.INTER_LINEAR_EXACT,
            cubic=cv2.INTER_CUBIC,
            area=cv2.INTER_AREA,
            lanczos4=cv2.INTER_LANCZOS4,
        ).get(interpolation, None):
            return kernel
        raise ValueError(f"Unsupported interpolation type: {interpolation}")
