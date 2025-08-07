from fastapi import HTTPException, UploadFile, APIRouter, File
import json
from pathlib import Path
from app.modules.module import ModuleBase
from app.db.convert_json_to_modules import get_all_mock_modules
from app.services.modules import append_to_mock_data

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
@router.get("/", response_model=list[ModuleBase], response_model_exclude_none=True)
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


# Endpoint to upload a new processing module (binary)
@router.post("/upload", response_model=bool)
async def upload_module(
    config: UploadFile = File(...),
    darwin_exec: UploadFile = File(...),
    darwin_lib: UploadFile = File(...),
    linux_exec: UploadFile = File(...),
    linux_lib: UploadFile = File(...),
    windows_exec: UploadFile = File(...),
    windows_lib: UploadFile = File(...),
) -> bool:
    try:
        # Create folder structured by OS
        file_structure: dict[str, list[tuple[str | None, UploadFile]]] = {
            "Darwin-arm64": [
                ("config.json", config),
                (darwin_exec.filename, darwin_exec),
                (darwin_lib.filename, darwin_lib),
            ],
            "Linux-x86_64": [
                ("config.json", config),
                (linux_exec.filename, linux_exec),
                (linux_lib.filename, linux_lib),
            ],
            "Windows-AMD64": [
                ("config.json", config),
                (windows_exec.filename, windows_exec),
                (windows_lib.filename, windows_lib),
            ],
        }

        # Create binaries directory if it doesn't exist to save the files
        BINARIES_DIR.mkdir(parents=True, exist_ok=True)

        # First, create a directory for the module
        config_content: bytes = await config.read()
        text: str = config_content.decode("utf-8")
        data = json.loads(text)
        # Remove file extension in case the user put it into the executable field
        executable_name: str = Path(data.get("executable", "unknown_module")).stem
        module_dir: Path = BINARIES_DIR / executable_name
        if module_dir.exists() and module_dir.is_dir():
            raise FileExistsError(
                f"Module with executable {executable_name} already exists."
            )
        module_dir.mkdir(parents=True, exist_ok=True)

        # Then, save each file in the appropriate OS subdirectory
        for os_name, files in file_structure.items():
            os_dir: Path = module_dir / os_name
            os_dir.mkdir(parents=True, exist_ok=True)
            for filename, file in files:
                if filename is not None:
                    file_path: Path = os_dir / filename
                    with file_path.open("wb") as f:
                        if file == config:
                            f.write(config_content)
                        else:
                            f.write(await file.read())

        # Read config file to add binary to module registry
        append_to_mock_data(data)
        return True
    except Exception as e:
        raise HTTPException(500, detail=f"Error uploading module: {str(e)}")
