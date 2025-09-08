from pathlib import Path
from typing import Any, override
import numpy as np
from app.modules.module import ModuleBase
from app.schemas.module import ModuleFormat, ModuleParameter, VideoOutputParams
import av
import os
from fractions import Fraction
import queue
from typing import Optional


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
    def process(
        self,
        input_data: queue.Queue[Optional[np.ndarray]],
        parameters: dict[str, Any],
    ) -> Any:
        """
        Encode frames from a queue.
        """
        # mmrp/server/output
        out_path = (
            Path(__file__).resolve().parent.parent.parent.parent
            / "output"
            / parameters["path"]
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path = str(out_path)

        # Set video framerate
        fps = parameters["fps"]
        if not isinstance(fps, float):
            raise ValueError(f"Expected fps as float, got {type(fps)}")
        fps_rat = Fraction.from_float(fps).limit_denominator(1001)

        first_frame = input_data.get()
        if first_frame is None:
            raise RuntimeError("Queue closed before any frames received")

        h, w = first_frame.shape[:2]

        codec = "libvpx"
        target_bitrate = "10000000"
        max_bitrate = "29000000"
        bufsize = "58000000"
        cpu_used = "2"
        cpu_count = os.cpu_count()
        # This number of threads works well on M1 Pro MBP (10 core). Change this to meet your needs.
        threads = str(int((cpu_count if cpu_count is not None else 4) / 2))

        opts = {
            "b": target_bitrate,
            "maxrate": max_bitrate,
            "bufsize": bufsize,
            "rc_end_usage": "cq",
            "cq_level": "0",
            "deadline": "realtime",
            "cpu-used": cpu_used,
            "lag-in-frames": "25",
            "threads": threads,
        }

        try:
            with av.open(out_path, mode="w") as container:
                stream = container.add_stream(
                    codec_name=codec, rate=fps_rat, options=opts
                )  # type: ignore[reportUnknownMemberType]
                stream.width = w
                stream.height = h
                stream.pix_fmt = "yuv420p"

                # First frame
                frame_av = av.VideoFrame.from_ndarray(first_frame, format="bgr24")
                for packet in stream.encode(frame_av):
                    container.mux(packet)

                # Remaining frames
                while True:
                    try:
                        frame = input_data.get(timeout=2)
                    except queue.Empty:
                        continue
                    if frame is None:
                        break

                    frame_av = av.VideoFrame.from_ndarray(frame, format="bgr24")
                    for packet in stream.encode(frame_av):
                        container.mux(packet)

                for packet in stream.encode():
                    container.mux(packet)

        except Exception as e:
            raise RuntimeError(f"PyAV/FFmpeg encode failed: {e}")
