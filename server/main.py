from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path
import shutil
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.routers import pipeline, video, modules, frame, binaries
from app.services.binaries import download_gist_files, sync_binaries


api = APIRouter(prefix="/api")

api.include_router(pipeline.router)
api.include_router(video.router)
api.include_router(modules.router)
api.include_router(frame.router)
api.include_router(binaries.router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Download and extract all binaries
    binaries_dir = download_gist_files()
    sync_binaries("/home/test/binaries")

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

origins = ["http://localhost:3000", "http://10.47.53.99"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
