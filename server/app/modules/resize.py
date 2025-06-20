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
                default=50,
                required=False,
                min=1,
                max=200
            )
        ]
    
    def process(self, input_data, parameters):
        resize_factor = int(parameters.get("scale_factor"))
        output_path = Path(__file__).resolve().parent.parent.parent / "output" / f"resize_{resize_factor}.mp4"

        # Capture video
        cap = cv2.VideoCapture(input_data)
        fps = cap.get(cv2.CAP_PROP_FPS)

        # Calculate new dimensions
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        new_width = int(width * resize_factor / 100)
        new_height = int(height * resize_factor / 100)
        dim = (new_width, new_height)

        # Video writer
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, dim)

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