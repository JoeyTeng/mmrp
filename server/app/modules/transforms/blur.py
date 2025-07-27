import cv2
from typing import Any, Dict, List
from pathlib import Path
import numpy as np
from app.modules.module import ModuleBase
from app.utils.shared_functionality import as_context
from app.schemas.module import ModuleFormat, ModuleParameter
from app.modules.utils.enums import ColorSpace, ModuleName, ModuleType, PixelFormat


class BlurModule(ModuleBase):
    name: ModuleName
    type: ModuleType

    def __init__(self, **data: Dict[str, Any]) -> None:
        super().__init__(**data)

    def get_parameters(self) -> List[ModuleParameter]:
        return self.data["parameters"]

    def get_input_formats(self) -> list[ModuleFormat]:
        return [
            ModuleFormat(
                pixel_format=PixelFormat.BGR24, color_space=ColorSpace.BT_709_FULL
            ),
        ]

    def get_output_formats(self) -> list[ModuleFormat]:
        return self.get_input_formats()

    def process_frame(
        self, frame: np.ndarray[Any], parameters: Dict[str, Any]
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

    def process(self, input_data: str, parameters: Dict[str, Any]) -> None:
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
