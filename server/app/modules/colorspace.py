import cv2
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition

class Colorspace(ModuleBase):
    name = "colorspace"

    def get_parameters(self):
        return [
            ParameterDefinition(
                name="colorspace",
                type="str",
                default="ycrcb",
                choices=["ycrcb", "hsv", "lab", "rgb"],
                required=False
            )
        ]
    
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
    
    # Process the entire video
    def process(self, input_data, parameters):
        color_mode: str = parameters.get("colorspace", "ycrcb")
        
        match color_mode:
            case "ycrcb":
                return self.ycrcb(input_data)
            case _:
                raise ValueError(f"Unsupported colorspace mode: {color_mode}")

    # Transform video to YCrCb
    def ycrcb(self, video_path):
        output_path: str = str(Path(__file__).resolve().parent.parent.parent / "output" / "ycrcb.mp4")

        cap: cv2.VideoCapture = cv2.VideoCapture(video_path)
        fps: float = cap.get(cv2.CAP_PROP_FPS)
        size: tuple[int, int] = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))

        fourcc = getattr(cv2, "VideoWriter_fourcc")(*'mp4v')
        out: cv2.VideoWriter = cv2.VideoWriter(output_path, fourcc, fps, size)

        # Process frames
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
            out.write(ycrcb)
        
        cap.release()
        out.release()
        return output_path