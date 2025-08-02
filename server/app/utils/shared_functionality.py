from pathlib import Path
import re
import typing
import contextlib


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


def string_sanitizer(raw_name: str) -> str:
    cleaned = re.sub(
        r"[^a-zA-Z0-9]+", " ", raw_name
    )  # Replace all non-alphanumeric characters with space
    cleaned = re.sub(
        r"\s+", " ", cleaned
    )  # Replace multiple spaces with a single space
    cleaned = cleaned.strip()  # Strip leading/trailing whitespace
    return cleaned.title()  # Capitalize each word
