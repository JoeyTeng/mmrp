import cv2
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition

class Resize(ModuleBase):
    name = "resize"

    def get_parameters(self):
        return [
            ParameterDefinition(
                name="scale_factor",
                type="int",
                default=100,
                required=False,
                min=1,
                max=200
            )
        ]
    
    # Process a single frame
    def process_frame(self, frame, parameters):
        factor: int = int(parameters.get("scale_factor", 100))
        height, width = frame.shape[:2]
        new_size: tuple[int, int] = (int(width * factor / 100), int(height * factor / 100))
        return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
    
    # Process the entire video
    def process(self, input_data, parameters):
        resize_factor: int = int(parameters.get("scale_factor", 100))
        output_path: str = str(Path(__file__).resolve().parent.parent.parent / "output" / f"resize_{resize_factor}.mp4")

        # Capture video
        cap: cv2.VideoCapture = cv2.VideoCapture(input_data)
        fps: float = cap.get(cv2.CAP_PROP_FPS)

        # Calculate new dimensions
        width: int = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height: int = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        new_width: int = int(width * resize_factor / 100)
        new_height: int = int(height * resize_factor / 100)
        dim: tuple[int, int] = (new_width, new_height)

        # Video writer
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*'mp4v')
        out: cv2.VideoWriter = cv2.VideoWriter(output_path, fourcc, fps, dim)

        # Process frames
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            out.write(cv2.resize(frame, dim, interpolation = cv2.INTER_AREA))

        # Release the video capture and writer and close all windows
        cap.release()
        out.release()
        return output_path