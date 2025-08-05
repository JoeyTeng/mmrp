from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import asyncio
import json
import numpy as np
from app.utils.shared_functionality import as_context
from app.utils.quality_metrics import compute_metrics
from app.schemas.frame import FrameData
from app.schemas.pipeline import PipelineRequest
from app.services.pipeline import (
    prepare_pipeline,
    process_pipeline_frame,
)

router = APIRouter()

cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket) -> None:
    await websocket.accept()
    print("WebSocket connection accepted")

    try:
        # Receive pipeline request JSON
        init_msg: str = await websocket.receive_text()
        data = json.loads(init_msg)
        print(data)
        request: PipelineRequest = PipelineRequest(**data)

        (_, module_map, source_mod, result_modules, processing_nodes) = (
            prepare_pipeline(request)
        )

        with module_map[source_mod.id][0].process(
            None, module_map[source_mod.id][1]
        ) as (
            _,
            fps,
            frame_iter,
        ):
            for frame in frame_iter:
                frame_cache = {source_mod.id: frame}
                process_pipeline_frame(frame_cache, processing_nodes, module_map)

                # Prepare left/right frame mapping
                frames_by_side: dict[str, np.ndarray] = {}

                if len(result_modules) == 2:
                    for result_mod in result_modules:
                        video_player_side = module_map[result_mod.id][1].get(
                            "video_player", ""
                        )
                        sid = result_mod.source[0]
                        frames_by_side[video_player_side] = frame_cache[sid]

                elif len(result_modules) == 1:
                    video_player_side = module_map[result_modules[0].id][1].get(
                        "video_player", ""
                    )
                    sid = result_modules[0].source[0]
                    frames_by_side["left"] = frame
                    frames_by_side["right"] = frame_cache[sid]

                # Ensure order: [left, right]
                left_frame = frames_by_side.get("left")
                right_frame = frames_by_side.get("right")

                if left_frame is None or right_frame is None:
                    print("Warning: Missing left or right frame in mapping")
                    continue

                # Put both into a list for encoding
                result_frames: list[np.ndarray] = [left_frame, right_frame]

                encoded_blobs: list[bytes] = []
                mime = "image/webp"

                for frm in result_frames:
                    success, buffer = cv2.imencode(
                        ".webp", frm, [cv2.IMWRITE_WEBP_QUALITY, 100]
                    )
                    if not success:
                        # fallback to PNG
                        success, buffer = cv2.imencode(".png", frm)
                        mime = "image/png"

                    if not success:
                        continue

                    encoded_blobs.append(buffer.tobytes())

                # Compute quality metrics
                metrics = compute_metrics(left_frame, right_frame)

                # Send metadata per frame pair
                metadata = FrameData(fps=fps, mime=mime, metrics=metrics)
                await websocket.send_text(metadata.model_dump_json())

                # Send both frames
                for blob in encoded_blobs:
                    await websocket.send_bytes(blob)

                # Compute quality metrics
                metrics = compute_metrics(left_frame, right_frame)

                # Send metadata per frame pair
                metadata = FrameData(fps=fps, mime=mime, metrics=metrics)
                await websocket.send_text(metadata.model_dump_json())

                # Send both frames
                for blob in encoded_blobs:
                    await websocket.send_bytes(blob)

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
