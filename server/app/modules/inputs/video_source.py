import contextlib
from typing import Any, Iterator, override
import cv2
import numpy as np
from app.modules.module import ModuleBase
from app.schemas.module import ModuleFormat, ModuleParameter, VideoSourceParams
from app.modules.utils.enums import PixelFormat, ColorSpace
from app.utils.shared_functionality import get_video_path, as_context
from pathlib import Path


class VideoSource(ModuleBase):
    parameter_model: Any = VideoSourceParams

    @override
    def get_parameters(self) -> list[ModuleParameter]:
        return self.data.parameters

    @override
    def get_input_formats(self) -> list[ModuleFormat]:
        return []

    @override
    def get_output_formats(self) -> list[ModuleFormat]:
        # We support .mp4 imports (decoded by OpenCV as BGR24)
        # Width/height/fps will be resolved at runtime by the pipeline runner
        return [
            ModuleFormat(
                pixel_format=[PixelFormat.BGR24], color_space=[ColorSpace.BT_709_FULL]
            )
        ]

    @override
    def process_frame(self, frame: Any, parameters: dict[str, Any]) -> Any:
        # Source frames are injected by the pipeline service, never called directly
        raise NotImplementedError("Frame injection is handled by the pipeline service")

    # Process video path
    @override
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
