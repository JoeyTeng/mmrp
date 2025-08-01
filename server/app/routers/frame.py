from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import asyncio
import json
import numpy as np
from app.utils.shared_functionality import as_context
from app.utils.quality_metrics import compute_metrics
from app.schemas.frame import FrameData
from app.schemas.pipeline import PipelineModule, PipelineRequest
from app.services.pipeline import (
    get_execution_order,
    process_pipeline_frame,
    validate_parameters,
)
from app.services.module import registry

router = APIRouter()

cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())


@router.websocket("/ws/video")
async def video_feed(websocket: WebSocket) -> None:
    await websocket.accept()
    print("WebSocket connection accepted")

    # Wait for client to specify filenames
    try:
        # Receive pipeline request JSON
        init_msg: str = await websocket.receive_text()
        data = json.loads(init_msg)
        request: PipelineRequest = PipelineRequest(**data)

        # Resolve pipeline modules
        ordered_modules: list[PipelineModule] = get_execution_order(request.modules)
        # Check that the pipeline starts with a source module
        if not ordered_modules or ordered_modules[0].name != "source":
            raise ValueError("Pipeline must start with a source module")
        if ordered_modules[-1].name != "result":
            raise ValueError("Pipeline must end with a result module")

        # Registry lookup
        module_map = {
            m.id: (registry[m.name](), {p.key: p.value for p in m.parameters})
            for m in ordered_modules
        }

        # Validate module parameters
        for mod in ordered_modules:
            mod_id = mod.id
            mod_instance, params = module_map[mod_id]
            # Get expected parameter definitions
            param_defs = {p.name: p for p in mod_instance.get_parameters()}
            # Validate each parameter
            validate_parameters(params, param_defs, mod_instance)

        # Get source and result module
        source_mod = ordered_modules[0]
        result_modules = [
            module for module in ordered_modules if module.name == "result"
        ]

        # Check and validate result modules
        if not result_modules:
            raise ValueError("Pipeline must end with at least one result module")
        if len(result_modules) > 2:
            raise ValueError("A maximum of two processed results is supported")
        for result_mod in result_modules:
            if not result_mod.source:
                raise ValueError("Output source cannot be empty")
            if source_mod.id in result_mod.source:
                raise ValueError("Pipeline must have at least one processing node")

        # Get processing nodes (remove source and result modules)
        processing_nodes = [
            m for m in ordered_modules if m.name not in {"source", "result"}
        ]

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

                result_frames: list[np.ndarray] = []

                if len(result_modules) == 2:
                    for result_mod in result_modules:
                        sid = result_mod.source[0]
                        result_frames.append(frame_cache[sid])
                elif len(result_modules) == 1:
                    sid = result_modules[0].source[0]
                    result_frames.append(frame)  # original
                    result_frames.append(frame_cache[sid])  # processed

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
                    metrics = compute_metrics(result_frames[0], result_frames[1])

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
