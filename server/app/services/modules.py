from typing import Any
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent
MOCK_DATA_PATH = BASE_DIR / "db" / "mock_data.json"


def convert_format(format_entry: dict[str, Any]) -> dict[str, Any]:
    formats = format_entry.get("formats", {})
    result: dict[str, Any] = {}

    if "pixelFormat" in formats:
        result["pixel_format"] = formats["pixelFormat"]
    if "colorSpace" in formats:
        result["color_space"] = formats["colorSpace"]
    if "width" in formats:
        result["width"] = formats["width"]
    if "height" in formats:
        result["height"] = formats["height"]
    if "frameRate" in formats:
        result["frame_rate"] = formats["frameRate"]

    return result


def append_to_mock_data(config_data: Any) -> None:
    # Process input and output formats
    input_formats = [convert_format(f) for f in config_data.get("inputFormat", [])]
    output_formats = [convert_format(f) for f in config_data.get("outputFormat", [])]

    # Build new module
    new_module: dict[str, Any] = {
        "name": config_data.get("name", "unnamed_module"),
        "type": "processNode",
        "input_formats": input_formats,
        "output_formats": output_formats,
        "parameters": [],
    }

    # Add parameters
    for param in config_data.get("parameters", []):
        param_entry = {
            "name": param["name"],
            "flag": param.get("flag"),
            "type": param["type"],
            "required": param.get("required", False),
        }
        if "default" in param:
            param_entry["default"] = param["default"]
        if "description" in param:
            param_entry["description"] = param["description"]
        if "options" in param:
            param_entry["options"] = param["options"]
        if "min" in param:
            param_entry["min"] = param["min"]
        if "max" in param:
            param_entry["max"] = param["max"]

        new_module["parameters"].append(param_entry)

    with MOCK_DATA_PATH.open("r", encoding="utf-8") as f:
        modules_data = json.load(f)

    modules_data["data"].append(new_module)
    # Write back to file
    with MOCK_DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(modules_data, f, indent=2)
