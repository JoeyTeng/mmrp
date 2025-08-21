from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import shutil
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.routers import pipeline, video, modules, frame, binaries
from app.db.convert_json_to_modules import get_all_mock_modules
from app.services.binaries import download_gist_files

# --- API ---
api = APIRouter(prefix="/api")


@api.get("/healthz")
def healthz():
    return {"ok": True}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load a registry of all modules at start up
    get_all_mock_modules()
    # Download and extract all binaries
    binaries_dir = download_gist_files()

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

origins = ["http://localhost:3000", "http://10.47.53.99:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)
app.include_router(video.router)
app.include_router(modules.router)
app.include_router(frame.router)
app.include_router(binaries.router)
app.include_router(api)

app.mount("/", StaticFiles(directory="../client/out", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
