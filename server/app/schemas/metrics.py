from pydantic import BaseModel


class Metrics(BaseModel):
    psnr: float
    ssim: float
