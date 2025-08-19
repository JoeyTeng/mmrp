from fastapi import APIRouter, File, HTTPException, UploadFile
from app.utils.shared_functionality import (
    get_video_path_by_request,
    save_uploaded_video,
    stream_file,
    validate_video_extension,
)
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
        video_output: bool = request.output

        file_ext = validate_video_extension(video_name)
        video_path = get_video_path_by_request(video_name, video_output)

        return stream_file(video_path, file_ext, video_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"No such constraint field: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unknown error: {str(e)}")


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        filename = await save_uploaded_video(file)
        return {"filename": filename}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"No such constraint field: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unknown error: {str(e)}")
