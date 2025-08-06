from typing import Any, Optional
import cv2
import numpy as np
from app.utils.quality_metrics import compute_metrics
from app.schemas.pipeline import PipelineModule
from app.modules.module import ModuleBase
from app.schemas.metrics import Metrics


def map_frames(
    frame_cache: dict[str, np.ndarray],
    result_modules: list[PipelineModule],
    module_map: dict[str, tuple[ModuleBase, dict[str, Any]]],
    source_frame: np.ndarray,
) -> tuple[Optional[np.ndarray], Optional[np.ndarray]]:
    # Prepare left/right frame mapping
    frames_by_side: dict[str, np.ndarray] = {}

    if len(result_modules) == 2:
        for result_mod in result_modules:
            video_player_side = module_map[result_mod.id][1].get("video_player", "")
            sid = result_mod.source[0]
            frames_by_side[video_player_side] = frame_cache[sid]

    elif len(result_modules) == 1:
        video_player_side = module_map[result_modules[0].id][1].get("video_player", "")
        sid = result_modules[0].source[0]
        frames_by_side["left"] = source_frame
        frames_by_side["right"] = frame_cache[sid]

    # Ensure order: [left, right]
    left_frame = frames_by_side.get("left")
    right_frame = frames_by_side.get("right")

    return left_frame, right_frame


def encode_frames(frames: list[np.ndarray]) -> tuple[list[bytes], str]:
    encoded_blobs: list[bytes] = []
    mime = "image/webp"

    for frm in frames:
        success, buffer = cv2.imencode(".webp", frm, [cv2.IMWRITE_WEBP_QUALITY, 100])
        if not success:
            # fallback to PNG
            success, buffer = cv2.imencode(".png", frm)
            mime = "image/png"

        if success:
            encoded_blobs.append(buffer.tobytes())

    return encoded_blobs, mime


def compute_frame_metrics(left_frame: np.ndarray, right_frame: np.ndarray) -> Metrics:
    # Validate frame shapes and compute quality metrics
    if left_frame.shape != right_frame.shape:
        raise ValueError("Result frames must be the same size for metric comparison")
    return compute_metrics(left_frame, right_frame)
