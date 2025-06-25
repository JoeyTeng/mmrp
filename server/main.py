from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import frame
import uvicorn
from app.routers import pipeline, video

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)
app.include_router(video.router)
app.include_router(frame.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
