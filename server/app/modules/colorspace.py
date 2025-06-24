import cv2
import typing
from pathlib import Path
from app.utils.shared_functionality import as_context
from app.modules.base_module import ModuleBase, ParameterDefinition
import numpy as np


class Colorspace(ModuleBase):
    name = "colorspace"

    @typing.override
    # Get the parameters for the colorspace module
    def get_parameters(self) -> list[ParameterDefinition[typing.Any]]:
        return [
            ParameterDefinition(
                name="input_colorspace",
                type="str",
                default="rgb",
                valid_values=["ycrcb", "hsv", "lab", "rgb", "bgr"],
                required=True,
            ),
            ParameterDefinition(
                name="output_colorspace",
                type="str",
                default="rgb",
                valid_values=["ycrcb", "hsv", "lab", "rgb", "bgr"],
                required=True,
            ),
        ]

    @typing.override
    # Process a single frame
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, typing.Any]
    ) -> np.ndarray:
        input: str = parameters["input_colorspace"]
        output: str = parameters["output_colorspace"]
        # Differentiate between different input and output color modes
        return self.match_colorspace(frame, input, output)

    @typing.override
    # Process the entire video
    def process(self, input_data: str, parameters: dict[str, typing.Any]) -> None:
        output_path: str = str(
            Path(__file__).resolve().parent.parent.parent
            / "output"
            / "colorspace_conversion.mp4"
        )

        # Video capture setup
        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())

        # Video writer setup
        cv2VideoWriterContext = as_context(cv2.VideoWriter, lambda cap: cap.release())
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*"mp4v")

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

    # Process output colorspace (handle valid values)
    def match_colorspace(
        self, frame: np.ndarray, input_color: str, output_color: str
    ) -> np.ndarray:
        if input_color == output_color:
            return frame

        error: ValueError = ValueError(
            f"Unsupported output colorspace: {output_color} for input: {input_color}"
        )

        match input_color:
            case "ycrcb":
                match output_color:
                    case "rgb":
                        return cv2.cvtColor(frame, cv2.COLOR_YCrCb2RGB)
                    case "bgr":
                        return cv2.cvtColor(frame, cv2.COLOR_YCrCb2BGR)
                    case _:
                        raise error
            case "hsv":
                match output_color:
                    case "rgb":
                        return cv2.cvtColor(frame, cv2.COLOR_HSV2RGB)
                    case "bgr":
                        return cv2.cvtColor(frame, cv2.COLOR_HSV2BGR)
                    case _:
                        raise error
            case "lab":
                match output_color:
                    case "rgb":
                        return cv2.cvtColor(frame, cv2.COLOR_Lab2RGB)
                    case "bgr":
                        return cv2.cvtColor(frame, cv2.COLOR_Lab2BGR)
                    case _:
                        raise error
            case "rgb":
                match output_color:
                    case "bgr":
                        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                    case "ycrcb":
                        return cv2.cvtColor(frame, cv2.COLOR_RGB2YCrCb)
                    case "hsv":
                        return cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
                    case "lab":
                        return cv2.cvtColor(frame, cv2.COLOR_RGB2Lab)
                    case _:
                        raise error
            case "bgr":
                match output_color:
                    case "rgb":
                        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    case "ycrcb":
                        return cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
                    case "hsv":
                        return cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                    case "lab":
                        return cv2.cvtColor(frame, cv2.COLOR_BGR2Lab)
                    case _:
                        raise error
            case _:
                raise ValueError(f"Unsupported input colorspace: {input_color}")
