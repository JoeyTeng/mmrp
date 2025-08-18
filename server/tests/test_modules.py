import json
from pathlib import Path
from typing import Any
import pytest

from app.services.modules import convert_format, append_to_mock_data


# Test that convert_format only keeps allowed keys and ignores extra ones
def test_convert_format_filters_allowed_keys() -> None:
    entry: dict[str, Any] = {
        "formats": {
            "pixel_format": ["bgr24"],
            "color_space": ["BT.709 Full"],
            "width": 1920,
            "height": 1080,
            "frame_rate": 30,
            "extra_key": "ignore_me",
        }
    }
    result = convert_format(entry)
    assert set(result.keys()) == {
        "pixel_format",
        "color_space",
        "width",
        "height",
        "frame_rate",
    }
    assert "extra_key" not in result


# Test that convert_format returns empty dict if input is empty
def test_convert_format_empty_formats() -> None:
    entry: dict[str, Any] = {"formats": {}}
    assert convert_format(entry) == {}


@pytest.fixture
def tmp_db_dir(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    # Redirect BASE_DIR/db/json_data into a tmpdir
    base_dir = tmp_path
    monkeypatch.setattr("app.services.modules.BASE_DIR", base_dir)
    db_dir = base_dir / "db" / "json_data"
    db_dir.mkdir(parents=True)
    return db_dir


# Returns a sample config representing a processing node
def valid_processing_node_config() -> dict[str, Any]:
    return {
        "name": "color",
        "executable": "color.exe",
        "input_formats": [
            {"formats": {"pixel_format": ["bgr24"], "color_space": ["BT.709 Full"]}}
        ],
        "output_formats": [
            {"formats": {"pixel_format": ["bgr24"], "color_space": ["BT.709 Full"]}}
        ],
        "parameters": [
            {
                "name": "input_colorspace",
                "flag": "-ic",
                "type": "str",
                "default": "RGB",
                "required": True,
                "options": ["YCrCb", "HSV", "Lab", "RGB"],
                "description": "Input color space",
            },
            {
                "name": "output_colorspace",
                "flag": "-oc",
                "type": "str",
                "default": "RGB",
                "required": True,
                "options": ["YCrCb", "HSV", "Lab", "RGB"],
                "description": "Output color space",
            },
        ],
    }


# Test that append_to_mock_data correctly writes a processing node JSON file
def test_append_to_mock_data_processing_node(tmp_db_dir: Path) -> None:
    cfg = valid_processing_node_config()
    append_to_mock_data(cfg)

    out_file = tmp_db_dir / "color.json"
    assert out_file.exists()

    with out_file.open() as f:
        data = json.load(f)

    module = data["data"][0]
    assert module["name"] == "color"
    assert module["type"] == "processNode"
    assert module["executable_path"] == "color"
    assert module["input_formats"][0] == {
        "pixel_format": ["bgr24"],
        "color_space": ["BT.709 Full"],
    }
    assert module["output_formats"][0] == {
        "pixel_format": ["bgr24"],
        "color_space": ["BT.709 Full"],
    }

    param1 = module["parameters"][0]
    assert param1["name"] == "input_colorspace"
    assert param1["required"] is True
    assert param1["type"] == "select"
    assert param1["default"] == "RGB"

    param2 = module["parameters"][1]
    assert param2["name"] == "output_colorspace"
    assert param2["required"] is True
    assert param2["type"] == "select"
    assert param2["default"] == "RGB"


# Test that append_to_mock_data sets default name and strips .exe extension
def test_append_to_mock_data_defaults_and_strips_extension(tmp_db_dir: Path) -> None:
    cfg: dict[str, Any] = {
        "input_formats": [],
        "output_formats": [],
        "executable": "blur.exe",
    }
    append_to_mock_data(cfg)

    out_file = tmp_db_dir / "blur.json"
    assert out_file.exists()

    with out_file.open() as f:
        data = json.load(f)

    module = data["data"][0]
    assert module["name"] == "Unnamed Module"
    assert module["executable_path"] == "blur"


# Test that append_to_mock_data raises ValueError for invalid parameter definitions
def test_append_to_mock_data_validation_error_raises(tmp_db_dir: Path) -> None:
    cfg: dict[str, Any] = {
        "name": "BrokenModule",
        "executable": "broken",
        "input_formats": [],
        "output_formats": [],
        "parameters": [{"name": "badparam", "flag": "--bad"}],
    }

    with pytest.raises(ValueError, match="Invalid parameter definition"):
        append_to_mock_data(cfg)


# Test that append_to_mock_data preserves required/constraint info on parameters
def test_append_to_mock_data_merges_constraints(tmp_db_dir: Path) -> None:
    cfg: dict[str, Any] = valid_processing_node_config()
    append_to_mock_data(cfg)

    out_file = tmp_db_dir / "color.json"
    with out_file.open() as f:
        data = json.load(f)

    param = data["data"][0]["parameters"][0]
    assert param["required"] is True
    assert param["type"] == "select"
    assert param["default"] == "RGB"
