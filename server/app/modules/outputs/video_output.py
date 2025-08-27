from pathlib import Path
from typing import Any, override
import cv2
from app.modules.module import ModuleBase
from app.schemas.module import ModuleFormat, ModuleParameter, VideoOutputParams
from app.utils.shared_functionality import as_context, encode_video


class VideoOutput(ModuleBase):
    parameter_model: Any = VideoOutputParams

    @override
    def get_parameters(self) -> list[ModuleParameter]:
        return self.data.parameters

    @override
    def get_input_formats(self) -> list[ModuleFormat]:
        return self.data.input_formats or []

    @override
    def get_output_formats(self) -> list[ModuleFormat]:
        return []

    @override
    def process_frame(self, frame: Any, parameters: dict[str, Any]) -> Any:
        # Pass‐through
        raise NotImplementedError

    @override
    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        # mmrp/server/output
        out_path = (
            Path(__file__).resolve().parent.parent.parent.parent
            / "output"
            / parameters["path"]
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Check if original video is provided (and is YUV)
        original: str = parameters.get("original", "")
        if original.endswith(".yuv"):
            encode_video(input_data, out_path)
            return

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

        with cv2VideoWriterContext(str(out_path), fourcc, fps, (w, h)) as out:
            # Write the first frame
            out.write(first_frame)
            # Write the remaining frames
            for frame in input_data:
                out.write(frame)
