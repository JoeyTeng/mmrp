import cv2
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition

class Blur(ModuleBase):
    name = "blur"

    def get_parameters(self):
        return [
            ParameterDefinition(
                name="kernel_size",
                type="int",
                default=5,
                required=False,
                min=1,
                max=99
            ),
            ParameterDefinition(
                name="method",
                type="str",
                default="gaussian",
                required=False,
                choices=["gaussian", "median", "bilateral"]
            )
        ]
    
    # Process a single frame
    def process_frame(self, frame, parameters):
        kernel_size = int(parameters.get("kernel_size"))
        method = parameters.get("method")
        # Ensure kernel size is odd
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

    # Process the entire video
    def process(self, input_data, parameters):
        kernel_size = int(parameters.get("kernel_size", 5))
        method = parameters.get("method", "gaussian")

        # Ensure kernel size is odd and >= 1
        if kernel_size % 2 == 0:
            kernel_size += 1

        output_path = Path(__file__).resolve().parent.parent.parent / "output" / f"blur_{method}.mp4"

        cap = cv2.VideoCapture(input_data)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            match method:
                case "gaussian":
                   blurred = cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0) 
                case "median":
                    blurred = cv2.medianBlur(frame, kernel_size)
                case "bilateral":
                    blurred = cv2.bilateralFilter(frame, d=kernel_size, sigmaColor=75, sigmaSpace=75)
                case _:
                    raise ValueError(f"Unsupported blur method: {method}")

            out.write(blurred)

        cap.release()
        out.release()
        return output_path