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
        color_mode = parameters.get("colorspace")
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
        color_mode = parameters.get("colorspace")
        
        match color_mode:
            case "ycrcb":
                return self.ycrcb(input_data)
            case _:
                raise ValueError(f"Unsupported colorspace mode: {color_mode}")

    # Transform video to YCrCb
    def ycrcb(self, video_path):
        output_path = Path(__file__).resolve().parent.parent.parent / "output" / "ycrcb.mp4"

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, size)

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