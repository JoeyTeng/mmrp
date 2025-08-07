from pydantic import BaseModel


class Metrics(BaseModel):
    message: str | None
    psnr: float | None
    ssim: float | None
