import dataclasses
import json
from fastapi import APIRouter
from typing import Any
from pathlib import Path
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.schemas.module import ModuleParameter, Module
from app.services.module import registry

router = APIRouter(
    prefix="/module",
    tags=["module"],
    responses={404: {"description": "Not Found"}},
)

BASE_DIR = Path(__file__).resolve().parents[2]
BINARIES_DIR = BASE_DIR / "binaries"


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
