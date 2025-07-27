from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.services.pipeline import handle_pipeline_request

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"],
    responses={404: {"description": "Not Found"}},
)


# Endpoint to execute a video pipeline frame by frame
@router.post("/", response_model=PipelineResponse)
def process_pipeline(request: PipelineRequest):
    try:
        return handle_pipeline_request(request)
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
