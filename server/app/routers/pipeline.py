from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from app.schemas.pipeline import PipelineRequest, PipelineResponse
from app.schemas.pipeline import ExamplePipeline
from app.services.pipeline import handle_pipeline_request, list_examples

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
    # TODO: handle all exceptions that can be raised during pipeline processing
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e}")
    except TypeError as e:
        raise HTTPException(status_code=422, detail=f"Type error: {e}")
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e.errors()}")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Value error: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/examples/", response_model=list[ExamplePipeline])
def get_pipeline_examples():
    try:
        return list_examples()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
