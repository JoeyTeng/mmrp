from collections.abc import Iterator
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim  # type: ignore
from typing import Optional, cast
from app.schemas.metrics import Metrics
from app.schemas.video import VideoMetadata


# Compute byte sizes for a single YUV420p frame
def _yuv420_frame_sizes(w: int, h: int) -> tuple[int, int]:
    y = w * h
    return y, int(y * 3 / 2)


# Stream Y (luma) planes from a raw YUV420p file
def _read_y_planes(meta: VideoMetadata) -> Iterator[np.ndarray]:
    """Yield Y (luma) frames (H x W, uint8) from a raw yuv420p file."""
    y_bytes, frame_bytes = _yuv420_frame_sizes(meta.width, meta.height)
    with open(meta.path, "rb") as f:
        while True:
            ybuf = f.read(y_bytes)
            if len(ybuf) != y_bytes:
                break
            # skip chroma
            rest = f.read(frame_bytes - y_bytes)
            if len(rest) != frame_bytes - y_bytes:
                break
            yield np.frombuffer(ybuf, dtype=np.uint8).reshape(meta.height, meta.width)


# Compute PSNR between two luma frames
def _psnr_y(y1: np.ndarray, y2: np.ndarray) -> float:
    diff = y1.astype(np.float32) - y2.astype(np.float32)
    mse = float(np.mean(diff * diff))
    if mse == 0.0:
        return 100.0
    return 20.0 * np.log10(255.0 / np.sqrt(mse))


# Compute SSIM on luma frames
def _ssim_y(y1: np.ndarray, y2: np.ndarray) -> float:
    score = cast(float, ssim(y1, y2, data_range=255))
    return score


# Compare two YUV420p videos frame-by-frame on the Y (luma) plane
def compute_metrics_yuv_luma_series(
    video1: VideoMetadata,
    video2: VideoMetadata,
    max_frames: Optional[int] = None,
) -> list[Metrics]:
    """
    Frames must have identical dimensions; otherwise, emit a message
    and skip PSNR/SSIM for that frame.
    """
    video1_iter = _read_y_planes(video1)
    video2_iter = _read_y_planes(video2)

    out: list[Metrics] = []
    n = 0
    for y1, y2 in zip(video1_iter, video2_iter):
        if y1.shape != y2.shape:
            out.append(
                Metrics(
                    message="Result frames must be the same size for metric comparison",
                    psnr=None,
                    ssim=None,
                )
            )
        else:
            out.append(
                Metrics(
                    message=None,
                    psnr=_psnr_y(y1, y2),
                    ssim=_ssim_y(y1, y2),
                )
            )

        n += 1
        if max_frames is not None and n >= max_frames:
            break

    return out


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
