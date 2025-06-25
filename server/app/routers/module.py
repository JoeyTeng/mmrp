import dataclasses
from fastapi import APIRouter
from typing import Any
from app.modules.base_module import ModuleBase, ParameterDefinition
from app.schemas.module import ModuleParameter, Module
from app.services.module import registry

router = APIRouter(
    prefix="/module",
    tags=["module"],
    responses={404: {"description": "Not Found"}},
)


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
