from contextlib import ExitStack
from fastapi import APIRouter, WebSocket
from pathlib import Path
import cv2
import asyncio
import json
import numpy as np
from typing import Dict, List, Optional, Union
from app.utils.shared_functionality import as_context

router = APIRouter()

cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket) -> None:
    await websocket.accept()

    # Wait for client to specify mode
    try:
        init_msg: str = await websocket.receive_text()
        init_data = json.loads(init_msg)
        mode: str = init_data.get("mode", "single")
    except Exception:
        await websocket.close()
        return

    base_path: Path = (
        Path(__file__).resolve().parent.parent.parent.parent / "server" / "videos"
    )
    video_paths: List[Path] = [base_path / "example-video.mp4"]
    if mode == "dual":
        video_paths.append(base_path / "example-video-filter.mp4")

    try:
        with ExitStack() as stack:
            caps: List[cv2.VideoCapture] = [
                stack.enter_context(cv2VideoCaptureContext(str(path)))
                for path in video_paths
            ]

            if not all(cap.isOpened() for cap in caps):
                await websocket.close()
                return

            fps: float = caps[0].get(cv2.CAP_PROP_FPS) or 30.0
            mime_type: str = "image/webp"

            while all(cap.isOpened() for cap in caps):
                frames: List[Optional[np.ndarray]] = []
                for cap in caps:
                    ret, frame = cap.read()
                    if not ret:
                        return  # Exit if any video ends

                    encode_success: bool
                    buffer: Optional[np.ndarray]
                    encode_success, buffer = cv2.imencode(
                        ".webp", frame, [cv2.IMWRITE_WEBP_QUALITY, 100]
                    )
                    assert isinstance(buffer, (np.ndarray, type(None)))

                    if not encode_success:
                        mime_type = "image/png"
                        encode_success, buffer = cv2.imencode(".png", frame)
                        assert isinstance(buffer, (np.ndarray, type(None)))

                    if encode_success:
                        frames.append(buffer)
                    else:
                        frames.append(None)

                # Skip sending frames if any encoding failed
                if any(buf is None for buf in frames):
                    continue

                metadata: Dict[str, Union[int, float, str]] = {
                    "fps": fps,
                    "mime": mime_type,
                    "count": len(frames),
                }
                await websocket.send_text(json.dumps(metadata))

                for buf in frames:
                    if buf is not None:
                        await websocket.send_bytes(buf.tobytes())

                await asyncio.sleep(1 / fps)

    except Exception as e:
        print("WebSocket error:", e)
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed
