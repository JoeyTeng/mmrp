from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pathlib import Path
from app.utils.shared_functionality import get_video_path
from app.utils.constants import VIDEO_TYPES
from app.schemas.video import VideoRequest

router = APIRouter(
    prefix="/video",
    tags=["video"],
    responses={
        404: {"description": "Video not found"},
        400: {"description": "Invalid video file"},
        500: {"description": "Internal server error"},
    },
)


# Send a mp4 video to the frontend
@router.post("/")
def get_video(request: VideoRequest):
    try:
        video_name: str = request.video_name
        file_ext = Path(video_name).suffix.lower()

        if file_ext not in VIDEO_TYPES:
            raise HTTPException(
                400, detail=f"Unsupported format. Allowed: {list(VIDEO_TYPES.keys())}"
            )

        # Get video path
        if request.output:
            video_path = (
                Path(__file__).resolve().parent.parent.parent / "output" / video_name
            )
        else:
            video_path = get_video_path(video_name)

        if not video_path.exists():
            raise HTTPException(404, detail=f"Video not found at {video_path}")

        # Read video in chunks for better performance
        def iterfile(chunk_size: int = 1024 * 1024):  # 1 MB chunks
            with open(video_path, "rb") as file:
                while chunk := file.read(chunk_size):
                    yield chunk

        return StreamingResponse(
            iterfile(),
            media_type=VIDEO_TYPES[file_ext],
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename={video_name}",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
