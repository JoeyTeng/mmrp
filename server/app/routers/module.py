import importlib
import pkgutil
from fastapi import APIRouter
from typing import Type
from app.modules.base_module import ModuleBase
import app.modules as module_pkg

router = APIRouter(
    prefix="/module",
    tags=["module"],
    responses={404: {"description": "Not Found"}},
)

registry: dict[str, Type[ModuleBase]] = {}

# Automatically find all subclasses of type ModuleBase
def load_modules():
    for _, module_name, _ in pkgutil.iter_modules(module_pkg.__path__):
        if module_name in {"base_module"}:
            continue
        module = importlib.import_module(f"app.modules.{module_name}")
        for attr in dir(module):
            obj = getattr(module, attr)
            if (
                isinstance(obj, type)
                and issubclass(obj, ModuleBase)
                and obj is not ModuleBase
            ):
                registry[obj.name] = obj


# Returns all modules and their parameters
@router.get("/")
def get_all_modules():
    return list(registry.keys())