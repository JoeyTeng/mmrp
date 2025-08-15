from app.modules.module import ModuleBase


class ModuleRegistry:
    _modules: dict[str, ModuleBase] = {}

    @classmethod
    def register(cls, module: ModuleBase) -> None:
        cls._modules[module.id] = module

    @classmethod
    def get(cls, module_id: str) -> ModuleBase:
        return cls._modules[module_id]

    @classmethod
    def get_by_spacename(cls, module_class: str) -> ModuleBase:
        for module in cls._modules.values():
            if module.data.module_class == module_class:
                return module
        raise KeyError(f"No module found with spacename starting with: {module_class}")

    @classmethod
    def get_all(cls) -> dict[str, ModuleBase]:
        return cls._modules

    @classmethod
    def clear(cls) -> None:
        cls._modules.clear()
