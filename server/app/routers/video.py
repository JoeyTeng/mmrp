from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pathlib import Path
from app.utils.shared_functionality import get_video_path

router = APIRouter(
    prefix="/video",
    tags=["video"],
    responses={404: {"description": "Not Found"}},
)


# Send a mp4 video to the frontend
@router.get("/{video_name}")
def get_video(video_name: str):
    if video_name.endswith("_output"):
        video_path = (
            Path(__file__).resolve().parent.parent.parent / "output" / video_name
        )
    else:
        video_path = get_video_path(video_name)

    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    # Read video in chunks for better performance
    def iterfile(chunk_size: int = 1024 * 1024):  # 1 MB chunks
        with open(video_path, "rb") as file:
            while chunk := file.read(chunk_size):
                yield chunk

    return StreamingResponse(iterfile(), media_type="video/webm")
