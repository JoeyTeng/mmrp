import base64
from collections import defaultdict, deque
from pathlib import Path
import typing
import contextlib
import re
import uuid
import cv2
import numpy as np
from app.schemas.pipeline import PipelineModule
from app.utils.enums import VideoFormats
from app.schemas.video import VideoMetadata


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


def create_filename_base(source_file: str) -> str:
    unique_id = uuid.uuid4()
    filename_base64 = (
        base64.urlsafe_b64encode(unique_id.bytes).decode("utf-8").rstrip("=")
    )
    filename = f"{source_file}-{filename_base64}"
    return filename


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


# Encode a YUV file to WEBM format
def encode_video(input: VideoMetadata, output_path: Path):
    w, h, fps = input.width, input.height, input.fps
    fourcc = getattr(cv2, "VideoWriter_fourcc")(*"VP80")

    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (w, h))
    frame_bytes = w * h * 3 // 2  # yuv420p

    print(f"Writing video to {output_path}, width: {w}, height: {h}, fps: {fps}")

    with open(input.path, "rb") as in_file:
        while True:
            buf = in_file.read(frame_bytes)
            if len(buf) != frame_bytes:
                break
            # I420 layout: Y (h*w) + U (h/2*w/2) + V (h/2*w/2)
            yuv = np.frombuffer(buf, dtype=np.uint8).reshape(h * 3 // 2, w)
            bgr = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR_I420)
            writer.write(bgr)

        writer.release()


# Topological sort to get modules in correct execution order in the pipeline
def get_execution_order(modules: list[PipelineModule]) -> list[PipelineModule]:
    # Map module id -> module
    module_map: dict[str, PipelineModule] = {mod.id: mod for mod in modules}
    all_module_ids = set(module_map.keys())

    # Build the dependency graph (adjacency list of dependent ids)
    graph: defaultdict[str, list[str]] = defaultdict(list)

    # Tracks how many dependecies each module has
    indegree: dict[str, int] = {mod.id: len(mod.source) for mod in modules}

    for mod in modules:
        if mod.source:
            for dep_id in mod.source:
                if dep_id not in all_module_ids:
                    raise ValueError(
                        f"Pipeline contains an invalid reference: {dep_id}"
                    )
                graph[dep_id].append(mod.id)

    # Start with modules that have no dependencies
    queue: deque[str] = deque(
        [module_id for module_id, degree in indegree.items() if degree == 0]
    )
    execution_order: list[PipelineModule] = []

    while queue:
        current_id = queue.popleft()
        execution_order.append(module_map[current_id])

        for dependent_id in graph[current_id]:
            indegree[dependent_id] -= 1
            if indegree[dependent_id] == 0:
                queue.append(dependent_id)

    remaining_with_deps = [
        module_id for module_id, degree in indegree.items() if degree > 0
    ]
    if remaining_with_deps:
        raise ValueError(
            f"Pipeline contains a cycle involving module IDs: {remaining_with_deps}"
        )

    return execution_order
