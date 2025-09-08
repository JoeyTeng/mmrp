import cv2
import numpy as np
from typing import cast
from app.schemas.metrics import Metrics


def compute_psnr(img1: np.ndarray, img2: np.ndarray) -> float:
    diff = img1.astype(np.float32) - img2.astype(np.float32)
    mse = float(np.mean(diff * diff))
    if mse <= 0.0:
        return 100.0
    PIXEL_MAX = 255.0
    return float(20.0 * np.log10(PIXEL_MAX / np.sqrt(mse)))


def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    """Compute SSIM for Y plane, from RGB to YUV following BT. 601 conversion using full-range.
    Ref: https://docs.opencv.org/4.x/de/d25/imgproc_color_conversions.html#color_convert_rgb_gray
    """
    # NOTE: cv2 stubs are incomplete. Pyright flags cvtColor, COLOR_BGR2GRAY, and quality.* as unknown. We ignore
    # types on those calls only.

    # Only compute if not already grayscale
    gray1 = (
        img1
        if (img1.ndim == 2 or (img1.ndim == 3 and img1.shape[2] == 1))
        else cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    )  # type: ignore[attr-defined]
    gray2 = (
        img2
        if (img2.ndim == 2 or (img2.ndim == 3 and img2.shape[2] == 1))
        else cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    )  # type: ignore[attr-defined]

    q = cv2.quality.QualitySSIM_create(gray1)  # type: ignore[attr-defined]
    score = cast(np.ndarray, q.compute(gray2))  # type: ignore[reportUnknownMemberType]

    return float(np.asarray(score, dtype=np.float64).flat[0])


# TODO: Support YUV_I420 format in addition to RGB.
#       For YUV_I420 input, expect a tuple of 3 np.ndarrays (Y, U, V), and compute metrics only on the Y plane.
def compute_metrics(img1: np.ndarray, img2: np.ndarray) -> Metrics:
    return Metrics(
        message=None,
        psnr=float(compute_psnr(img1, img2)),
        ssim=float(compute_ssim(img1, img2)),
    )
