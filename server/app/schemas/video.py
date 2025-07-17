from pydantic import BaseModel


class VideoRequest(BaseModel):
    video_name: str
    output: bool
