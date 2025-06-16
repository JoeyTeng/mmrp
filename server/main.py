from fastapi import FastAPI
import uvicorn
from app.routers import pipeline

app = FastAPI()

app.include_router(pipeline.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
