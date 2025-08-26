from pathlib import Path
from pydantic import BaseModel


class VideoRequest(BaseModel):
    video_name: str
    output: bool


class VideoMetadata(BaseModel):
    path: Path
    path2: Path | None = None
    width: int
    height: int
    fps: float
