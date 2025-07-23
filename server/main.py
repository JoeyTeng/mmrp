from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import shutil
import uvicorn
from app.routers import pipeline, video, frame, binaries
from app.services.module import load_modules
from app.services.binaries import download_gist_files
from app.routers import modules


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load a registry of all modules at start up
    load_modules()
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


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)
app.include_router(video.router)
app.include_router(modules.router)
app.include_router(frame.router)
app.include_router(binaries.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
