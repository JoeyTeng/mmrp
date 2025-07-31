import dataclasses
import json
from fastapi import APIRouter, UploadFile, HTTPException, File
from typing import Any
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.schemas.module import ModuleParameter, Module, ModuleFormat
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

        role = instance.role

        parameters: list[ParameterDefinition[Any]] = instance.get_parameters()

        param_models = [ModuleParameter(**dataclasses.asdict(p)) for p in parameters]

        input_fmts = [
            ModuleFormat(**dataclasses.asdict(f)) for f in instance.get_input_formats()
        ]

        output_fmts = [
            ModuleFormat(**dataclasses.asdict(f)) for f in instance.get_output_formats()
        ]

        module_list.append(
            Module(
                id=i,
                name=name,
                role=role,
                parameters=param_models,
                input_formats=input_fmts,
                output_formats=output_fmts,
            )
        )

    return module_list


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
        module_name: str = data.get("name", "unknown_module")
        module_dir: Path = BINARIES_DIR / module_name
        if module_dir.exists() and module_dir.is_dir():
            raise FileExistsError(f"Module {module_name} already exists.")
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
        # TODO: add to registry (needs new module structure implementation)
        return True
    except Exception as e:
        raise HTTPException(500, detail=f"Error uploading module: {str(e)}")
