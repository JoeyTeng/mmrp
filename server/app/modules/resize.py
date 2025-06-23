import cv2
import typing
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.utils.shared_functionality import as_context
import numpy as np

class Resize(ModuleBase):
    name = "resize"

    @typing.override
    # Get the parameters for the resize module
    def get_parameters(self) -> list[ParameterDefinition[typing.Any]]:
        return [
            ParameterDefinition(
                name="scale_factor",
                type="int",
                default=100,
                required=False,
                valid_values=(1, 200)
            )
        ]
    
    @typing.override
    # Process a single frame
    def process_frame(self, frame: np.ndarray, parameters: dict[str, typing.Any]) -> np.ndarray:
        factor: int = int(parameters.get("scale_factor", 100))
        height, width = frame.shape[:2]
        new_size: tuple[int, int] = (int(width * factor / 100), int(height * factor / 100))
        return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
    
    @typing.override
    # Process the entire video
    def process(self, input_data: str, parameters: dict[str, typing.Any]) -> None:
        resize_factor: int = int(parameters.get("scale_factor", 100))
        output_path: str = str(Path(__file__).resolve().parent.parent.parent / "output" / f"resize_{resize_factor}.mp4")

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

            # Calculate new dimension
            new_width: int = int(width * resize_factor / 100)
            new_height: int = int(height * resize_factor / 100)
            dim: tuple[int, int] = (new_width, new_height)

            with cv2VideoWriterContext(output_path, fourcc, fps, (new_width, new_height)) as out:
                # Process and write frames
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    out.write(cv2.resize(frame, dim, interpolation = cv2.INTER_AREA))

        