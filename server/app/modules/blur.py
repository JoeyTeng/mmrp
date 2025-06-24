import cv2
import typing
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.utils.shared_functionality import as_context
import numpy as np

class Blur(ModuleBase):
    name = "blur"

    @typing.override
    # Get the parameters for the blur module
    def get_parameters(self) -> list[ParameterDefinition[typing.Any]]:
        return [
            ParameterDefinition(
                name="kernel_size",
                type="int",
                default=5,
                required=True
            ),
            ParameterDefinition(
                name="method",
                type="str",
                default="gaussian",
                valid_values=["gaussian", "median", "bilateral"],
                required=True
            )
        ]
    
    @typing.override
    # Process a single frame
    def process_frame(self, frame: np.ndarray, parameters: dict[str, typing.Any]) -> np.ndarray:
        kernel_size: int = parameters["kernel_size"]
        method: str = parameters["method"]
        # Ensure kernel size is odd
        # TODO: replace this with a proper parameter validation & error reporting mechanism
        if kernel_size % 2 == 0:
            kernel_size += 1
        # Differentiate between different blur methods
        match method:
            case "gaussian":
                return cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0)
            case "median":
                return cv2.medianBlur(frame, kernel_size)
            case "bilateral":
                return cv2.bilateralFilter(frame, d=kernel_size, sigmaColor=75, sigmaSpace=75)
            case _:
                raise ValueError(f"Unsupported blur method: {method}")

    @typing.override
    # Process the entire video
    def process(self, input_data: str, parameters: dict[str, typing.Any]) -> None:
        output_path: str = str(Path(__file__).resolve().parent.parent.parent / "output" / f"blur.mp4") 

        # Video capture setup
        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())

        # Video writer setup
        cv2VideoWriterContext = as_context(cv2.VideoWriter, lambda cap: cap.release())
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*'mp4v')

        with cv2VideoCaptureContext(input_data) as cap:
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {input_data}")
            fps = cap.get(cv2.CAP_PROP_FPS)
            width: int = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height: int = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            with cv2VideoWriterContext(output_path, fourcc, fps, (width, height)) as out:
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    output_frame = self.process_frame(frame, parameters)
                    out.write(output_frame)
