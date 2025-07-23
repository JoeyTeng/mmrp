from pathlib import Path
from typing import Any, Iterator, List, Union, Dict
import cv2
import numpy as np
from app.modules.module import ModuleBase
from app.schemas.module import ModuleFormat, ModuleParameter
from app.modules.utils.enums import ModuleName, ModuleType, PixelFormat, ColorSpace
from app.utils.shared_functionality import as_context


class VideoOutput(ModuleBase):
    name: ModuleName
    type: ModuleType

    def __init__(self, **data: Dict[str, Any]) -> None:
        super().__init__(**data)

    def get_parameters(self) -> Dict[str, ModuleParameter]:
        return {}

    def get_input_formats(self) -> List[ModuleFormat]:
        return [
            ModuleFormat(pixel_format=PixelFormat.BGR24, color_space=ColorSpace.BT_709_FULL)
        ]

    def get_output_formats(self) -> List[ModuleFormat]:
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
        fps = parameters["fps"]
        if not isinstance(fps, float):
            raise ValueError(f"Expected fps as float, got {type(fps)}")

        # Second value is the first frame
        first_frame = next(input_data)

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
                out.write(frame)