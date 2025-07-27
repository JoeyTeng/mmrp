import importlib
from pathlib import Path
from typing import Dict, Type
from app.modules.module import ModuleBase

registry: Dict[str, Type[ModuleBase]] = {}
base_path = Path("app/modules")


def load_modules() -> None:
    for path in base_path.rglob("*.py"):
        if path.name == "__init__.py":
            continue

        module_path = str(path.with_suffix("")).replace("/", ".")
        try:
            module = importlib.import_module(module_path)
            for attr in dir(module):
                obj = getattr(module, attr)
                if (
                    isinstance(obj, type)
                    and issubclass(obj, ModuleBase)
                    and obj is not ModuleBase
                ):
                    registry[path.stem] = obj
        except ImportError as e:
            print(f"Could not import module {module_path}: {e}")
    print(f"Module registry loaded with {len(registry)} modules.")
