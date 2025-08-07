import cv2
from typing import Any, override
from pathlib import Path
import numpy as np
from app.modules.module import ModuleBase
from app.utils.shared_functionality import as_context
from app.schemas.module import ColorspaceParams, ModuleFormat, ModuleParameter


class ColorModule(ModuleBase):
    parameter_model: Any = ColorspaceParams

    @override
    def get_parameters(self) -> list[ModuleParameter]:
        return self.data.parameters

    @override
    def get_input_formats(self) -> list[ModuleFormat]:
        return self.data.input_formats or []

    @override
    def get_output_formats(self) -> list[ModuleFormat]:
        return self.data.output_formats or []

    @override
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, Any]
    ) -> np.ndarray[Any]:
        input: str = parameters["input_colorspace"]
        output: str = parameters["output_colorspace"]
        return self.match_colorspace(frame, input, output)

    def match_colorspace(
        self, frame: np.ndarray, input_color: str, output_color: str
    ) -> np.ndarray[Any]:
        if input_color == output_color:
            return frame
        constant_name = f"COLOR_{input_color}2{output_color}"
        if hasattr(cv2, constant_name):
            color = getattr(cv2, constant_name)
            return cv2.cvtColor(frame, color)
        raise ValueError(
            f"Unsupported input-output ColorSpace: {input_color} {output_color}"
        )

    @override
    def process(self, input_data: str, parameters: dict[str, Any]) -> None:
        output_path: str = str(
            Path(__file__).resolve().parent.parent.parent
            / "output"
            / "colorspace_conversion.webm"
        )

        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())
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
