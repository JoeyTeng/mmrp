from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import shutil
import uvicorn
from app.routers import pipeline, video, modules, frame, binaries
from app.db.convert_json_to_modules import get_all_mock_modules


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load a registry of all modules at start up
    get_all_mock_modules()

    yield  # Application is running

    # Cleanup
    try:
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
