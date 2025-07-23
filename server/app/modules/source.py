from typing import Any, Iterator
from app.modules.base_module import (
    ModuleBase,
    ParameterDefinition,
    FormatDefinition,
    ModuleRole,
)
from app.utils.shared_functionality import get_video_path, as_context
import cv2
import contextlib
import numpy as np
from pathlib import Path


class Source(ModuleBase):
    name = "source"

    role = ModuleRole.INPUT_NODE

    def get_parameters(self) -> list[ParameterDefinition[Any]]:
        return [
            ParameterDefinition(
                name="path",
                type="str",
                required=True,
                default="example-video.mp4",
                description="Filesystem path to the input .mp4 video",
            )
        ]

    def get_input_formats(self) -> list[FormatDefinition]:
        # No upstream inputs
        return []

    def get_output_formats(self) -> list[FormatDefinition]:
        # We support .mp4 imports (decoded by OpenCV as BGR24)
        # Width/height/fps will be resolved at runtime by the pipeline runner
        return [
            FormatDefinition(
                pixel_format="bgr24",  # default in openCV
                color_space="BT.709 Full",
                width=None,
                height=None,
                frame_rate=None,
            )
        ]

    def process_frame(self, frame: Any, parameters: dict[str, Any]) -> Any:
        # Source frames are injected by the pipeline service, never called directly
        raise NotImplementedError("Frame injection is handled by the pipeline service")

    # Process video path
    def process(
        self, input_data: Any, parameters: dict[str, Any]
    ) -> contextlib.AbstractContextManager[tuple[str, float, Iterator[np.ndarray]]]:
        # Get source file and name
        source_file: str = str(parameters["path"])
        name_without_ext = Path(source_file).stem
        video_path = get_video_path(source_file)

        cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())

        # Return a generator function that opens and yields frames
        @contextlib.contextmanager
        def generator_context():
            with cv2VideoCaptureContext(str(video_path)) as cap:
                if not cap.isOpened():
                    raise ValueError(f"Could not open video file: {video_path}")
                fps = cap.get(cv2.CAP_PROP_FPS)

                def frame_generator():
                    while True:
                        ret, frame = cap.read()
                        if not ret:
                            break
                        yield frame

                yield name_without_ext, fps, frame_generator()

        return generator_context()
