import cv2
import typing
from pathlib import Path
from app.utils.shared_functionality import as_context
from app.modules.base_module import ModuleBase, ParameterDefinition

class Colorspace(ModuleBase):
    name = "colorspace"

    @typing.override
    # Get the parameters for the colorspace module
    def get_parameters(self):
        return [
            ParameterDefinition(
                name="colorspace",
                type="str",
                default="rgb",
                valid_values=["ycrcb", "hsv", "lab", "rgb"],
                required=False
            )
        ]
    
    @typing.override
    # Process a single frame
    def process_frame(self, frame, parameters):
        color_mode: str = parameters.get("colorspace", "rgb")
        # Differentiate between different color modes
        match color_mode:
            case "ycrcb":
                return cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
            case "hsv":
                return cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            case "lab":
                return cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
            case "rgb":
                return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            case _:
                raise ValueError(f"Unsupported colorspace mode: {color_mode}")
    
    @typing.override
    # Process the entire video
    def process(self, input_data, parameters):
        colorspace: str = parameters.get("colorspace", "rgb")
        output_path: str = str(Path(__file__).resolve().parent.parent.parent / "output" / f"colorspace_{colorspace}.mp4")

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
        
        cap.release()
        out.release()
