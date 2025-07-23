from fastapi import HTTPException
from pathlib import Path
from fastapi import APIRouter
from pydantic import ValidationError
from app.modules.module import ModuleBase
from app.db.convert_json_to_modules import get_all_mock_modules

router = APIRouter(
    prefix="/modules",
    tags=["modules"],
    responses={404: {"description": "Not Found"}},
)

BASE_DIR: Path = Path(__file__).resolve().parents[2]
BINARIES_DIR: Path = BASE_DIR / "binaries"


# Returns all modules and their parameters
@router.get("/", response_model=list[ModuleBase])
async def get_modules():
    try:
        return get_all_mock_modules()
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
