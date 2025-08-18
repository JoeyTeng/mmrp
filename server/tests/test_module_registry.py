import pytest
from app.modules.module import ModuleBase
from app.modules.transforms.color import ColorModule
from app.modules.transforms.blur import BlurModule
from app.modules.transforms.resize import ResizeModule
from app.schemas.module import ModuleData, Position
from app.services.module_registry import ModuleRegistry


@pytest.fixture(autouse=True)
def clear_registry_before_and_after():
    # Clear the registry before and after each test
    ModuleRegistry.clear()
    yield
    ModuleRegistry.clear()


# Create a module instance with minimal data for testing
def make_module(module_class: type[ModuleBase], name: str) -> ModuleBase:
    data = ModuleData(
        name=name,
        module_class=module_class.__name__,
        parameters=[],
        input_formats=[],
        output_formats=[],
    )
    position = Position(x=0.0, y=0.0)
    return module_class(
        id=name,
        type="processNode",
        position=position,
        data=data,
        executable_path=None,
    )


# Test that a registered module can be retrieved by ID
def test_register_and_get_module() -> None:
    mod = make_module(ColorModule, "color")
    ModuleRegistry.register(mod)

    retrieved = ModuleRegistry.get("color")
    assert retrieved == mod


# Test that getting a nonexistent module raises KeyError
def test_get_nonexistent_module_raises_keyerror() -> None:
    with pytest.raises(KeyError):
        ModuleRegistry.get("nonexistent")


# Test retrieving a module by its spacename
def test_get_by_spacename_returns_correct_module() -> None:
    mod1 = make_module(BlurModule, "blur")
    mod2 = make_module(ResizeModule, "resize")
    ModuleRegistry.register(mod1)
    ModuleRegistry.register(mod2)

    retrieved = ModuleRegistry.get_by_spacename("ResizeModule")
    assert retrieved == mod2


# Test that querying by spacename with no match raises KeyError
def test_get_by_spacename_no_match_raises_keyerror() -> None:
    mod1 = make_module(BlurModule, "blur")
    ModuleRegistry.register(mod1)

    with pytest.raises(KeyError, match="No module found with spacename"):
        ModuleRegistry.get_by_spacename("NonexistentModule")


# Test that get_all returns all registered modules
def test_get_all_returns_all_modules() -> None:
    mod1 = make_module(BlurModule, "blur")
    mod2 = make_module(ResizeModule, "resize")
    ModuleRegistry.register(mod1)
    ModuleRegistry.register(mod2)

    all_modules = ModuleRegistry.get_all()
    assert all_modules == {"blur": mod1, "resize": mod2}


# Test that clearing the registry removes all modules
def test_clear_removes_all_modules() -> None:
    mod1 = make_module(BlurModule, "blur")
    ModuleRegistry.register(mod1)

    ModuleRegistry.clear()
    assert ModuleRegistry.get_all() == {}
