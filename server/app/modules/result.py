from typing import Any, Iterator, Union
from app.modules.base_module import (
    ModuleBase,
    ParameterDefinition,
    FormatDefinition,
    ModuleRole,
)
from pathlib import Path
import numpy as np
import cv2
from app.utils.shared_functionality import as_context


# visual purpose
class Result(ModuleBase):
    name = "result"

    role = ModuleRole.OUTPUT_NODE

    def get_parameters(self) -> list[ParameterDefinition[Any]]:
        return [
            ParameterDefinition(
                name="video_player",
                type="str",
                required=False,
                description="Select on which side the video should be played (only for two pipelines)",
                constraints=["left", "right"],
                default="right",
            ),
        ]

    def get_input_formats(self) -> list[FormatDefinition]:
        # Accept whatever the pipeline hands it (we only decode/write BGR24 i OpenCV)
        return [
            FormatDefinition(
                pixel_format="bgr24",
                color_space="BT.709 Full",
                width=None,
                height=None,
                frame_rate=None,
            )
        ]

    def get_output_formats(self) -> list[FormatDefinition]:
        # No downstream consumers
        return []

    def process_frame(self, frame: Any, parameters: dict[str, Any]) -> Any:
        # Pass‐through
        raise NotImplementedError

    def process(
        self, input_data: Iterator[Union[float, np.ndarray]], parameters: dict[str, Any]
    ) -> Any:
        out_path = (
            Path(__file__).resolve().parent.parent.parent
            / "output"
            / parameters["path"]
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path = str(out_path)

        # Convert iterator to an explicit iterable to call next multiple times
        input_data = iter(input_data)

        # First value is FPS
        fps = next(input_data)
        if not isinstance(fps, float):
            raise ValueError(f"Expected fps as float, got {type(fps)}")

        # Second value is the first frame
        first_frame = next(input_data)
        if not isinstance(first_frame, np.ndarray):
            raise ValueError("Expected a video frame (np.ndarray), got something else.")

        h, w = first_frame.shape[:2]
        # FIXME: OpenCV warning (use a format that is supported with the codec)
        fourcc = getattr(cv2, "VideoWriter_fourcc")(*"VP80")

        # context wrapper
        cv2VideoWriterContext = as_context(
            cv2.VideoWriter, lambda writer: writer.release()
        )

        with cv2VideoWriterContext(out_path, fourcc, fps, (w, h)) as out:
            # Write the first frame
            out.write(first_frame)
            # Write the remaining frames
            for frame in input_data:
                if not isinstance(frame, np.ndarray):
                    raise ValueError(f"Expected np.ndarray, got {type(frame)}")
                out.write(frame)
