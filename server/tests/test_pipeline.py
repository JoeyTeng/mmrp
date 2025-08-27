from typing import Any, Optional, cast
import pytest
from unittest.mock import MagicMock
import numpy as np
from app.services.pipeline import (
    get_module_class,
    process_pipeline_frame,
    get_execution_order,
)
from app.schemas.pipeline import PipelineModule
from app.modules.module import ModuleBase
from app.modules.utils.enums import ModuleName


# Test that get_module_class returns the correct class name
def test_get_module_class_returns_module_class() -> None:
    module = MagicMock(spec=PipelineModule)
    module.module_class = ModuleName.VIDEO_SOURCE
    assert get_module_class(module) == ModuleName.VIDEO_SOURCE


# Identity mock function for process_frame
def mock_process_frame_identity(
    frame: np.ndarray, params: dict[str, Any]
) -> np.ndarray:
    return frame


# Doubles the frame for testing frame propagation
def mock_process_frame_double(frame: np.ndarray, params: dict[str, Any]) -> np.ndarray:
    return frame * 2


# Test that process_pipeline_frame propagates frames correctly through modules
def test_process_pipeline_frame_propagates_frames() -> None:
    # Create mock modules
    mod1 = MagicMock(spec=PipelineModule)
    mod1.id = "mod1"
    mod1.source = []

    mod2 = MagicMock(spec=PipelineModule)
    mod2.id = "mod2"
    mod2.source = ["mod1"]

    # Mock ModuleBase instances
    base1 = MagicMock()
    base2 = MagicMock()

    # Assign typed helper functions as side_effects
    base1.process_frame.side_effect = mock_process_frame_identity
    base2.process_frame.side_effect = mock_process_frame_double

    module_map = cast(
        dict[str, tuple[ModuleBase, dict[str, Any]]],
        {
            "mod1": (base1, {}),
            "mod2": (base2, {}),
        },
    )

    frame_cache = {"mod1": np.array([1, 2, 3])}
    ordered_modules = cast(list[PipelineModule], [mod2])

    process_pipeline_frame(frame_cache, ordered_modules, module_map)

    # mod2 should have produced doubled frame
    np.testing.assert_array_equal(frame_cache["mod2"], frame_cache["mod1"] * 2)


# Helper to create a PipelineModule with optional sources
def make_module(id_: str, sources: Optional[list[str]] = None) -> PipelineModule:
    sources = sources or []
    mod = MagicMock(spec=PipelineModule)
    mod.id = id_
    mod.source = sources
    return mod


# Test simple linear pipeline ordering
def test_get_execution_order_simple_linear() -> None:
    mod1 = make_module("m1")
    mod2 = make_module("m2", sources=["m1"])
    mod3 = make_module("m3", sources=["m2"])

    ordered = get_execution_order([mod1, mod2, mod3])
    assert [m.id for m in ordered] == ["m1", "m2", "m3"]


# Test branching pipeline ordering
def test_get_execution_order_branching() -> None:
    mod1 = make_module("m1")
    mod2 = make_module("m2", sources=["m1"])
    mod3 = make_module("m3", sources=["m1"])

    ordered = get_execution_order([mod1, mod2, mod3])
    assert ordered[0].id == "m1"
    assert set([m.id for m in ordered[1:]]) == {"m2", "m3"}


# Test that a pipeline cycle raises an error
def test_get_execution_order_cycle_raises() -> None:
    mod1 = make_module("m1", sources=["m3"])
    mod2 = make_module("m2", sources=["m1"])
    mod3 = make_module("m3", sources=["m2"])

    with pytest.raises(ValueError, match="Pipeline contains a cycle"):
        get_execution_order([mod1, mod2, mod3])


# Test that invalid module references raise an error
def test_get_execution_order_invalid_reference_raises() -> None:
    mod1 = make_module("m1", sources=["nonexistent"])
    with pytest.raises(ValueError, match="Pipeline contains an invalid reference"):
        get_execution_order([mod1])
