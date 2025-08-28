import cv2
from typing import Any, override
from pathlib import Path
import numpy as np
from app.modules.module import ModuleBase
from app.utils.shared_functionality import as_context
from app.schemas.module import BlurParams, ModuleFormat, ModuleParameter


class BlurModule(ModuleBase):
    parameter_model: Any = BlurParams

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
        kernel_size: int = parameters["kernel_size"]
        method: str = parameters["method"]
        if kernel_size % 2 == 0:
            kernel_size += 1
        match method:
            case "gaussian":
                return cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0)
            case "median":
                return cv2.medianBlur(frame, kernel_size)
            case "bilateral":
                return cv2.bilateralFilter(
                    frame, d=kernel_size, sigmaColor=75, sigmaSpace=75
                )
            case _:
                raise ValueError(f"Unsupported blur method: {method}")

    @override
    def process(
        self, input_data: str, parameters: dict[str, Any], session_id: str
    ) -> None:
        output_path: str = str(
            Path(__file__).resolve().parent.parent.parent / "output" / "blur.webm"
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
