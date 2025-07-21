import cv2
import numpy as np
from typing import Dict
from skimage.metrics import structural_similarity as ssim  # type: ignore
from typing import cast


def compute_psnr(img1: np.ndarray, img2: np.ndarray) -> float:
    mse = np.mean((img1.astype(np.float32) - img2.astype(np.float32)) ** 2)
    if mse == 0:
        return float("inf")
    PIXEL_MAX = 255.0
    return 20 * np.log10(PIXEL_MAX / np.sqrt(mse))


def compute_ssim(img1: np.ndarray, img2: np.ndarray) -> float:
    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    score = cast(float, ssim(gray1, gray2, full=False))
    return score


def compute_metrics(img1: np.ndarray, img2: np.ndarray) -> Dict[str, float]:
    return {
        "psnr": float(compute_psnr(img1, img2)),
        "ssim": float(compute_ssim(img1, img2)),
    }
