import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim  # type: ignore
from typing import cast
from app.schemas.metrics import Metrics


def compute_psnr(img1: np.ndarray, img2: np.ndarray) -> float:
    mse = np.mean((img1.astype(np.float32) - img2.astype(np.float32)) ** 2)
    if mse == 0:
        return 100.0
    PIXEL_MAX = 255.0
    return 20 * np.log10(PIXEL_MAX / np.sqrt(mse))


def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """Compute SSIM for Y plane, from RGB to YUV following BT. 601 conversion using full-range.
    Ref: https://docs.opencv.org/4.x/de/d25/imgproc_color_conversions.html#color_convert_rgb_gray
    """
    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    score = cast(float, ssim(gray1, gray2, full=False))
    return score


# TODO: Support YUV_I420 format in addition to RGB.
#       For YUV_I420 input, expect a tuple of 3 np.ndarrays (Y, U, V), and compute metrics only on the Y plane.
def compute_metrics(img1: np.ndarray, img2: np.ndarray) -> Metrics:
    return Metrics(
        message=None,
        psnr=float(compute_psnr(img1, img2)),
        ssim=float(compute_ssim(img1, img2)),
    )
