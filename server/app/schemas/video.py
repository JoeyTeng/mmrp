from pathlib import Path
from pydantic import BaseModel


class VideoRequest(BaseModel):
    video_name: str
    output: bool


class VideoMetadata(BaseModel):
    path: Path
    width: int
    height: int
    fps: float
