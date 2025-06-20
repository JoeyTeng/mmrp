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
                default="grayscale",
                choices=["grayscale, ycrcb"],
                required=False
            )
        ]
    
    def process(self, input_data, parameters):
        color_mode = parameters.get("colorspace")
        
        match color_mode:
            case "grayscale":
                return self.grayscale(input_data)
            case "ycrcb":
                return self.ycrcb(input_data)
            case _:
                raise ValueError(f"Unsupported colorspace mode: {color_mode}")
    

    # Transform video to grayscale
    def grayscale(self, video_path):
        output_path = Path(__file__).resolve().parent.parent.parent / "output" / "grayscale.mp4"

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, size, isColor=False)

        # Process frames
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            # Convert to grayscale and write to output
            out.write(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY))
        
        cap.release()
        out.release()
        return output_path


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