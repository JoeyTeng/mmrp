from fastapi import APIRouter, FastAPI
import argparse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import shutil
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.routers import pipeline, video, modules, frame, binaries
from app.services.binaries import sync_binaries
from app.db.convert_json_to_modules import get_all_mock_modules


api = APIRouter(prefix="/api")

api.include_router(pipeline.router)
api.include_router(video.router)
api.include_router(modules.router)
api.include_router(frame.router)
api.include_router(binaries.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Download and extract all binaries
    # binaries_dir = download_gist_files() # Config file in the gist is outdated, this would load the simple video processor without input and output formats
    binaries_dir = Path(__file__).resolve().parent / "binaries"

    sync_binaries("/home/test/binaries")

    # Load a registry of all modules at start up
    get_all_mock_modules()

    yield  # Application is running

    # Cleanup
    try:
        # Clean up binaries directory
        if binaries_dir.exists() and binaries_dir.is_dir():
            print(f"Cleaning up binaries directory: {binaries_dir}")
            shutil.rmtree(binaries_dir)
        # Clean up temporary binary data
        json_dir = (
            Path(__file__).resolve().parent / "app" / "db" / "json_data" / "binaries"
        )
        if json_dir.exists() and json_dir.is_dir():
            print(f"Cleaning up binaries data: {json_dir}")
            shutil.rmtree(json_dir)
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
