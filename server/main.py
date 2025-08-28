import argparse
import asyncio
from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import shutil
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
from app.routers import pipeline, video, modules, frame, binaries, session
from app.db.convert_json_to_modules import get_all_mock_modules
from app.services.binaries import download_gist_files
from app.services.session_manager import (
    session_cleaner,
    refresh_session,
    validate_session,
)
from app.context.session import set_session_context
from starlette.responses import Response
from typing import Awaitable, Callable


api = APIRouter(prefix="/api")

api.include_router(pipeline.router)
api.include_router(video.router)
api.include_router(modules.router)
api.include_router(frame.router)
api.include_router(binaries.router)
api.include_router(session.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load a registry of all modules at start up
    get_all_mock_modules()
    # Download and extract all binaries
    binaries_dir = download_gist_files()

    # Start background cleaner:
    # This will run daily to clean up expired sessions
    asyncio.create_task(session_cleaner())

    yield  # Application is running

    # Cleanup
    try:
        # Clean up binaries directory
        if binaries_dir.exists() and binaries_dir.is_dir():
            print(f"Cleaning up binaries directory: {binaries_dir}")
            shutil.rmtree(binaries_dir)
        # Clean up yuv video files
        videos_dir = Path(__file__).resolve().parent / "videos"
        if videos_dir.exists() and videos_dir.is_dir():
            for file in videos_dir.glob("*.yuv"):
                print(f"Cleaning up yuv video files: {file}")
                file.unlink(missing_ok=True)
        # Clean up output directory
        output_dir = Path(__file__).resolve().parent / "output"
        if output_dir.exists() and output_dir.is_dir():
            print(f"Cleaning up output directory: {output_dir}")
            shutil.rmtree(output_dir)
    except Exception as e:
        print(f"Error during cleanup: {e}")


app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json", lifespan=lifespan)
app.include_router(api)


@app.middleware("http")
async def auth_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path.startswith("/api/session"):
        return await call_next(request)

    session_id = request.headers.get("session_id")

    # If no session_id → reject
    if not session_id or not validate_session(session_id):
        return JSONResponse(
            status_code=400,
            content={
                "message": "Invalid or missing session.",
                "refresh_token": True,
            },
        )

    # Extend session validity
    refresh_session(session_id, sliding_expiration=True)

    # Attach for downstream handlers
    request.state.session_id = session_id

    # Set session context for the entire request lifecycle
    with set_session_context(session_id):
        response = await call_next(request)
        response.headers["session_id"] = session_id
        return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only mount static if the export exists (production)
out_dir = Path(__file__).resolve().parents[1] / "client" / "out"
if out_dir.exists():
    app.mount("/", StaticFiles(directory=str(out_dir), html=True), name="static")
else:

    @app.get("/")
    def dev_root():
        return {
            "msg": "Dev mode: Run `npm run dev` on port 3000, or build the client to create /client/out."
        }


def main():
    parser = argparse.ArgumentParser(description="Run FastAPI app")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--reload", action="store_true", help="Dev mode: auto-reload (single-process)"
    )
    parser.add_argument(
        "--log-level",
        default="info",
        choices=["critical", "error", "warning", "info", "debug", "trace"],
    )
    parser.add_argument(
        "--workers", type=int, default=1, help=">1 delegates to Uvicorn CLI"
    )
    args = parser.parse_args()

    config = uvicorn.Config(
        "main:app",
        host=args.host,
        port=args.port,
        log_level=args.log_level,
        workers=args.workers,
        proxy_headers=not args.reload,
        reload=args.reload,
    )
    server = uvicorn.Server(config)

    server.run()


if __name__ == "__main__":
    main()
