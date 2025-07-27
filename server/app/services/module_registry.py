from typing import Dict
from app.modules.module import ModuleBase


class ModuleRegistry:
    _modules: Dict[str, ModuleBase] = {}

    @classmethod
    def register(cls, module: ModuleBase) -> None:
        cls._modules[module.id] = module

    @classmethod
    def get(cls, module_id: str) -> ModuleBase:
        return cls._modules[module_id]

    @classmethod
    def get_by_spacename(cls, base_id: str) -> ModuleBase:
        for module_id, module in cls._modules.items():
            if module_id.startswith(f"{base_id}#"):
                return module
        raise KeyError(f"No module found with spacename starting with: {base_id}")

    @classmethod
    def get_all(cls) -> Dict[str, ModuleBase]:
        return cls._modules

    @classmethod
    def clear(cls) -> None:
        cls._modules.clear()
