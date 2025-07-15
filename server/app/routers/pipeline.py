from fastapi import APIRouter, HTTPException
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
        result = handle_pipeline_request(request)
        response = PipelineResponse(
            left=result.get("left", ""), right=result.get("right", "")
        )
        return response
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
