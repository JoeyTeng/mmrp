import cv2
import typing
from pathlib import Path
from app.utils.shared_functionality import as_context
from app.modules.base_module import (
    ModuleBase,
    ParameterDefinition,
    FormatDefinition,
    ModuleRole,
)
import numpy as np


class Colorspace(ModuleBase):
    name = "colorspace"

    role = ModuleRole.PROCESS_NODE

    @typing.override
    # Get the parameters for the colorspace module
    def get_parameters(self) -> list[ParameterDefinition[typing.Any]]:
        return [
            ParameterDefinition(
                name="input_colorspace",
                type="str",
                default="rgb",
                valid_values=["YCrCb", "HSV", "Lab", "RGB", "BGR"],
                required=True,
            ),
            ParameterDefinition(
                name="output_colorspace",
                type="str",
                default="rgb",
                valid_values=["YCrCb", "HSV", "Lab", "RGB", "BGR"],
                required=True,
            ),
        ]

    @typing.override
    def get_input_formats(self) -> list[FormatDefinition]:
        # input color space comes from parameter
        return [
            FormatDefinition(pixel_format="bgr24", color_space="param:input_colorspace")
        ]

    @typing.override
    def get_output_formats(self) -> list[FormatDefinition]:
        # output color space comes from parameter
        return [
            FormatDefinition(
                pixel_format="bgr24", color_space="param:output_colorspace"
            )
        ]

    @typing.override
    # Process a single frame
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, typing.Any]
    ) -> np.ndarray:
        input: str = parameters["input_colorspace"]
        output: str = parameters["output_colorspace"]
        # Differentiate between different input and output color modes
        return self.match_colorspace(frame, input, output)

    @typing.override
    # Process the entire video
    def process(self, input_data: str, parameters: dict[str, typing.Any]) -> None:
        output_path: str = str(
            Path(__file__).resolve().parent.parent.parent
            / "output"
            / "colorspace_conversion.webm"
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
            width: int = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height: int = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            with cv2VideoWriterContext(
                output_path, fourcc, fps, (width, height)
            ) as out:
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    output_frame = self.process_frame(frame, parameters)
                    out.write(output_frame)

    # Process output colorspace (handle valid values)
    def match_colorspace(
        self, frame: np.ndarray, input_color: str, output_color: str
    ) -> np.ndarray:
        if input_color == output_color:
            return frame
        constant_name = f"COLOR_{input_color}2{output_color}"
        if hasattr(cv2, constant_name):
            color = getattr(cv2, constant_name)
            return cv2.cvtColor(frame, color)
        raise ValueError(
            f"Unsupported input-output colorspaces: {input_color} {output_color}"
        )
