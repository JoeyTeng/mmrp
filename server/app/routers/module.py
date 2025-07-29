import dataclasses
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
        # Validate config file content
        print(config)
        print(windows_exec)
        return True
    except Exception as e:
        raise HTTPException(500, detail=f"Error uploading module: {str(e)}")
