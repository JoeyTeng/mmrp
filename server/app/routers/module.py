import importlib
import pkgutil
from fastapi import APIRouter
from typing import Type
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.schemas.module import ModuleParameter, Module
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
@router.get("/", response_model=list[Module])
def get_all_modules():
    module_list = []

    for i, (name, module) in enumerate(registry.items()):
        instance: ModuleBase = module()
        parameters: list[ParameterDefinition] = instance.get_parameters()

        param_models = [
            ModuleParameter(
                name=p.name,
                type=p.type,
                description=p.description,
                default=p.default,
                min=p.min,
                max=p.max,
                choices=p.choices,
                required=p.required
            )
            for p in parameters
        ]

        module_list.append(
            Module(
                id=i,
                name=name,
                parameters=param_models
            )
        )

    return module_list