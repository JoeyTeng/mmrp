from contextlib import ExitStack
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pathlib import Path
import cv2
import asyncio
import json
import numpy as np
from typing import Optional
from app.utils.shared_functionality import as_context
from app.utils.quality_metrics import compute_metrics
from app.schemas.frame import FrameData

router = APIRouter()

cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket) -> None:
    await websocket.accept()
    print("WebSocket connection accepted")

    # Wait for client to specify filenames
    try:
        init_msg: str = await websocket.receive_text()
        init_data = json.loads(init_msg)
        filenames: str = init_data.get("filenames")
    except Exception:
        await websocket.close()
        return

    base_path: Path = (
        Path(__file__).resolve().parent.parent.parent.parent / "server" / "videos"
    )
    video_paths: list[Path] = [base_path / name for name in filenames[:2]]

    try:
        with ExitStack() as stack:
            caps: list[cv2.VideoCapture] = [
                stack.enter_context(cv2VideoCaptureContext(str(path)))
                for path in video_paths
            ]

            if not all(cap.isOpened() for cap in caps):
                await websocket.close()
                return

            fps: float = caps[0].get(cv2.CAP_PROP_FPS) or 30.0
            mime_type: str = "image/webp"

            while all(cap.isOpened() for cap in caps):
                frames: list[Optional[np.ndarray]] = []
                raw_frames: list[
                    np.ndarray
                ] = []  # Keep originals for metrics computation

                for cap in caps:
                    ret, frame = cap.read()
                    if not ret:
                        return  # Exit if any video ends

                    raw_frames.append(frame)

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

                metrics = compute_metrics(raw_frames[0], raw_frames[1])
                metadata = FrameData(fps=fps, mime=mime_type, metrics=metrics)

                await websocket.send_text(metadata.model_dump_json())

                for buf in frames:
                    if buf is not None:
                        await websocket.send_bytes(buf.tobytes())

                await asyncio.sleep(0)

    except WebSocketDisconnect:
        print("WebSocket disconnected by the client")
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        try:
            await websocket.close()
            print("WebSocket closed")
        except RuntimeError:
            pass  # already closed
