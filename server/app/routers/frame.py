from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import asyncio
import json
import numpy as np
from pydantic import ValidationError
from app.utils.shared_functionality import as_context
from app.utils.quality_metrics import compute_metrics
from app.schemas.frame import FrameData
from app.schemas.pipeline import PipelineModule, PipelineRequest
from app.services.pipeline import (
    get_execution_order,
    get_module_class,
    process_pipeline_frame,
)
from app.modules.module import ModuleBase
from app.modules.utils.enums import ModuleName
from app.services.module_registry import ModuleRegistry

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
        print(data)
        request: PipelineRequest = PipelineRequest(**data)

        ordered_modules: list[PipelineModule] = get_execution_order(request.modules)
        # Validate pipeline structure
        if not ordered_modules:
            raise ValueError("Pipeline is empty")

        first_module_base = get_module_class(ordered_modules[0])
        if first_module_base != ModuleName.VIDEO_SOURCE:
            raise ValueError(
                f"Pipeline must start with a {ModuleName.VIDEO_SOURCE} module"
            )

        last_module_base = get_module_class(ordered_modules[-1])
        if last_module_base != ModuleName.RESULT:
            raise ValueError(f"Pipeline must end with a {ModuleName.RESULT} module")

        # Registry lookup
        module_map: dict[str, tuple[ModuleBase, dict[str, Any]]] = {
            m.id: (
                ModuleRegistry.get_by_spacename(get_module_class(m)),
                {p.key: p.value for p in m.parameters},
            )
            for m in ordered_modules
        }

        # Validate module parameters
        for mod in ordered_modules:
            mod_id = mod.id
            mod_instance, _ = module_map[mod_id]
            param_dict = {p.key: p.value for p in mod.parameters}
            try:
                validated = mod_instance.parameter_model(**param_dict)
            except ValidationError as e:
                raise ValueError(
                    f"Parameter validation failed for module {mod.name}:\n{e}"
                )
            module_map[mod_id] = (mod_instance, validated.model_dump())

        # Get source and result module
        source_mod = ordered_modules[0]
        result_modules = [
            module
            for module in ordered_modules
            if get_module_class(module) == ModuleName.RESULT
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
            m
            for m in ordered_modules
            if m.module_class not in {ModuleName.VIDEO_SOURCE, ModuleName.RESULT}
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
