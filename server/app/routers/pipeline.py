from fastapi import APIRouter
from app.schemas.pipeline import PipelineRequest
from app.services.pipeline import handle_pipeline_request

router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"],
    responses={404: {"description": "Not Found"}},
)


# Endpoint to execute a video pipeline frame by frame
@router.post("/", response_model=bool)
def process_pipeline(request: PipelineRequest):
    return handle_pipeline_request(request)
