from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from app.routers import pipeline, video, module, frame
from app.services.module import load_modules


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load a registry of all modules at start up
    load_modules()
    yield


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
app.include_router(module.router)
app.include_router(frame.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
