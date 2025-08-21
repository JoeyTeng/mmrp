from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from app.schemas.frame import FrameData
from app.schemas.pipeline import PipelineRequest
from app.services.pipeline import (
    prepare_pipeline,
    process_pipeline_frame,
)
from app.services.frame import compute_frame_metrics, encode_frames, map_frames

router = APIRouter()


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket) -> None:
    await websocket.accept()
    print("WebSocket connection accepted")

    try:
        # Receive pipeline request JSON
        init_msg: str = await websocket.receive_text()
        data = json.loads(init_msg)
        request: PipelineRequest = PipelineRequest(**data)

        # Prepare ordered modules, module mapping, and processing nodes
        (module_map, source_mod, result_modules, processing_nodes) = prepare_pipeline(
            request
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

                # Run the frame through all processing nodes in sequence
                process_pipeline_frame(frame_cache, processing_nodes, module_map)

                # Map processed frames to left/right view
                left_frame, right_frame = map_frames(
                    frame_cache=frame_cache,
                    result_modules=result_modules,
                    module_map=module_map,
                    source_frame=frame,
                )

                if left_frame is None or right_frame is None:
                    print("Warning: Missing left or right frame in mapping")
                    continue

                # Encode frames into bytes and determine MIME type
                encoded_blobs, mime = encode_frames([left_frame, right_frame])

                # Compute quality metrics
                metrics = compute_frame_metrics(left_frame, right_frame)

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
