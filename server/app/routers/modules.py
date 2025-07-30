from fastapi import HTTPException
from pathlib import Path
from fastapi import APIRouter
from app.modules.module import ModuleBase
from app.db.convert_json_to_modules import get_all_mock_modules

router = APIRouter(
    prefix="/modules",
    tags=["modules"],
    responses={
        404: {"description": "Modules not found"},
        400: {"description": "Invalid request data or parameters"},
        500: {"description": "Internal server error"},
    },
)

BASE_DIR: Path = Path(__file__).resolve().parents[2]
BINARIES_DIR: Path = BASE_DIR / "binaries"


# Returns all modules and their parameters
@router.get("/", response_model=list[ModuleBase])
async def get_modules():
    try:
        return get_all_mock_modules()
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Value Error: {str(e)}")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unknown error: {str(e)}")
