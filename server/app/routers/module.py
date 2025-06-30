import dataclasses
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Any
from pathlib import Path
import shutil
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.schemas.module import ModuleParameter, Module
from app.services.module import registry

router = APIRouter(
    prefix="/module",
    tags=["module"],
    responses={404: {"description": "Not Found"}},
)

BASE_DIR: Path = Path(__file__).resolve().parents[2]
BINARIES_DIR: Path = BASE_DIR / "binaries"


# Returns all modules and their parameters
@router.get("/", response_model=list[Module])
def get_all_modules() -> list[Module]:
    module_list: list[Module] = []

    for i, (name, module) in enumerate(registry.items()):
        instance: ModuleBase = module()
        parameters: list[ParameterDefinition[Any]] = instance.get_parameters()

        param_models = [ModuleParameter(**dataclasses.asdict(p)) for p in parameters]

        module_list.append(Module(id=i, name=name, parameters=param_models))

    return module_list


# Returns all binaries and their parameters
@router.get("/binaries")
def get_all_binaries() -> list[dict[str, Any]]:
    binaries: list[dict[str, Any]] = []

    for binary_dir in BINARIES_DIR.iterdir():
        if not binary_dir.is_dir():
            continue
        config_path = binary_dir / "config.json"
        if not config_path.exists():
            continue

        try:
            with open(config_path, "r") as f:
                config = json.load(f)
        except Exception:
            continue

        binaries.append(
            {"name": binary_dir.name, "parameters": config.get("parameters", [])}
        )

    return binaries


# Endpoint to upload a new executable and the config file for parameters
@router.post("/binaries/upload")
async def upload_binary(
    name: str = Form(...),
    binary_file: UploadFile = File(...),
    config_file: UploadFile = File(...),
):
    # Validate name
    target_dir: Path = BINARIES_DIR / name
    if target_dir.exists():
        raise HTTPException(status_code=400, detail=f"Binary '{name}' already exists.")

    # Create folder
    target_dir.mkdir(parents=True)

    try:
        # Save binary
        if binary_file.filename is None:
            raise ValueError("Missing binary name")
        binary_path: Path = target_dir / binary_file.filename
        with binary_path.open("wb") as f:
            shutil.copyfileobj(binary_file.file, f)

        # Save config file
        config_path = target_dir / "config.json"
        with config_path.open("wb") as f:
            shutil.copyfileobj(config_file.file, f)

        # Validate config
        with open(config_path, "r") as f:
            config = json.load(f)
        if "parameters" not in config:
            raise HTTPException(
                status_code=400, detail="Invalid config.json: missing 'parameters'."
            )

        return {"message": f"Binary '{name}' uploaded successfully."}

    except Exception as e:
        shutil.rmtree(target_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
