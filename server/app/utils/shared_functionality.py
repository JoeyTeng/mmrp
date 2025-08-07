from pathlib import Path
import typing
import contextlib
import cv2
import re
import numpy as np
from app.utils.enums import VideoFormats


def string_sanitizer(raw_name: str) -> str:
    cleaned = re.sub(
        r"[^a-zA-Z0-9]+", " ", raw_name
    )  # Replace all non-alphanumeric characters with space
    cleaned = re.sub(
        r"\s+", " ", cleaned
    )  # Replace multiple spaces with a single space
    cleaned = cleaned.strip()  # Strip leading/trailing whitespace
    return cleaned.title()  # Capitalize each word


# Get path of input video
def get_video_path(video: str) -> Path:
    return (
        Path(__file__).resolve().parent.parent.parent.parent
        / "server"
        / "videos"
        / video
    )


# Context manager for video capture and video writer
T = typing.TypeVar("T")
P = typing.ParamSpec("P")


def as_context(
    func: typing.Callable[P, T],
    on_exit: typing.Callable[[T], None] | None = None,
) -> typing.Callable[P, contextlib.AbstractContextManager[T]]:
    """Decorator to convert a function into a context manager."""

    @contextlib.contextmanager
    def wrapper(
        *args: P.args,
        **kwargs: P.kwargs,
    ) -> typing.Generator[T, None, None]:
        resource: T = func(*args, **kwargs)
        try:
            yield resource
        finally:
            if on_exit:
                on_exit(resource)

    return wrapper


# Write a YUV frame from a numpy ndarray
def write_yuv420_frame(frame: np.ndarray, path: Path) -> Path:
    """Write a single BGR frame to YUV420p raw file."""
    yuv = cv2.cvtColor(frame, cv2.COLOR_BGR2YUV_I420)
    with open(path, "wb") as f:
        f.write(yuv.tobytes())
    return path


# Decode YUV frame to numpy ndarray
def read_yuv420_frame(path: Path, width: int, height: int) -> np.ndarray:
    expected_size = width * height * 3 // 2
    data = path.read_bytes()
    if len(data) != expected_size:
        raise ValueError(
            f"YUV size mismatch: expected {expected_size}, got {len(data)}"
        )
    # this is following BT. 601 Limited Range.
    # Ref: https://docs.opencv.org/4.x/de/d25/imgproc_color_conversions.html#color_convert_rgb_yuv_42x
    yuv = np.frombuffer(data, dtype=np.uint8).reshape((height * 3 // 2, width))
    return cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR_I420)


# Decode a video file to a specified output format such as YUV
def decode_video(
    video_path: Path, input_colorspace: VideoFormats, output_format: VideoFormats
) -> Path:
    video = str(video_path)
    output_path = video_path.parent / f"{video_path.stem}.{output_format}"

    # Video capture setup
    cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())

    with cv2VideoCaptureContext(video) as cap:
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video}")

        with open(output_path, "wb") as out_file:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                constant_name = f"COLOR_{input_colorspace}2{output_format}"
                if not hasattr(cv2, constant_name):
                    raise ValueError(
                        f"Unsupported conversion: {input_colorspace} to {output_format}"
                    )
                color = getattr(cv2, constant_name)
                output_frame = cv2.cvtColor(frame, color)
                out_file.write(output_frame.tobytes())

    return Path(output_path)
