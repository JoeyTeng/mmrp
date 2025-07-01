from fastapi import APIRouter, WebSocket
from pathlib import Path
import cv2
import asyncio
import json
from app.utils.shared_functionality import as_context

router = APIRouter()

cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket):
    await websocket.accept()

    video_path = (
        Path(__file__).resolve().parent.parent.parent.parent
        / "server"
        / "videos"
        / "example-video.mp4"
    )

    try:
        with cv2VideoCaptureContext(str(video_path)) as cap:
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            mime_type = "image/webp"

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                encode_success, buffer = cv2.imencode(
                    ".webp", frame, [cv2.IMWRITE_WEBP_QUALITY, 100]
                )

                if not encode_success:
                    mime_type = "image/png"
                    encode_success, buffer = cv2.imencode(".png", frame)

                if not encode_success:
                    continue

                # Send metadata with FPS and MIME type
                await websocket.send_text(json.dumps({"fps": fps, "mime": mime_type}))
                await websocket.send_bytes(buffer.tobytes())

                await asyncio.sleep(1 / fps)

    except Exception as e:
        print("WebSocket error:", e)
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed
