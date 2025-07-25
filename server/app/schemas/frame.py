from pydantic import BaseModel
from app.schemas.metrics import Metrics


class FrameData(BaseModel):
    fps: float
    mime: str
    metrics: Metrics
