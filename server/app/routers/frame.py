from fastapi import APIRouter, WebSocket
from pathlib import Path
import cv2
import asyncio
import json

router = APIRouter()


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket):
    await websocket.accept()

    video_path = (
        Path(__file__).resolve().parent.parent.parent.parent
        / "client"
        / "public"
        / "example-video.mp4"
    )
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            success, buffer = cv2.imencode(".jpg", frame)
            if not success:
                continue

            # Send FPS as JSON metadata
            await websocket.send_text(json.dumps({"fps": fps}))
            # Send the JPEG frame
            await websocket.send_bytes(buffer.tobytes())

            await asyncio.sleep(1 / fps)
    except Exception as e:
        print("WebSocket error:", e)
    finally:
        cap.release()
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already closed
