from typing import Any
from pathlib import Path
import json
from pydantic import ValidationError
from app.schemas.module import ModuleData

BASE_DIR = Path(__file__).resolve().parent.parent


def convert_format(format_entry: dict[str, Any]) -> dict[str, Any]:
    formats = format_entry.get("formats", {})
    allowed_keys = ["pixel_format", "color_space", "width", "height", "frame_rate"]

    return {key: formats[key] for key in allowed_keys if key in formats}


def append_to_mock_data(config_data: Any) -> None:
    # Process input and output formats
    input_formats = [convert_format(f) for f in config_data.get("input_formats", [])]
    output_formats = [convert_format(f) for f in config_data.get("output_formats", [])]

    name: str = config_data.get("name", "unnamed_module")
    output_path = BASE_DIR / "db" / "json_data" / f"{name}.json"

    # Build new module
    new_module: dict[str, Any] = {
        "name": config_data.get("name", "unnamed_module"),
        "type": "processNode",
        "input_formats": input_formats,
        "output_formats": output_formats,
        "parameters": [],
    }

    try:
        raw_params: list[dict[str, Any]] = config_data.get("parameters", [])
        enriched_data = ModuleData.model_validate({"parameters": raw_params})

        for parsed_param in enriched_data.parameters:
            raw_param: dict[str, Any] = next(
                (p for p in raw_params if p.get("name") == parsed_param.name),
                {},  # type: ignore
            )
            param_entry: dict[str, Any] = {
                "name": parsed_param.name,
                "flag": raw_param.get("flag"),
                "type": parsed_param.metadata.type,
                "required": parsed_param.metadata.constraints.required
                if parsed_param.metadata.constraints
                else False,
            }
            constraints = parsed_param.metadata.constraints
            if constraints:
                if constraints.default is not None:
                    param_entry["default"] = constraints.default
                if constraints.description:
                    param_entry["description"] = constraints.description
                if constraints.options:
                    param_entry["options"] = constraints.options
                if constraints.min is not None:
                    param_entry["min"] = constraints.min
                if constraints.max is not None:
                    param_entry["max"] = constraints.max

            new_module["parameters"].append(param_entry)

    except ValidationError as e:
        raise ValueError(f"Invalid parameter definition: {e}")

    with output_path.open("w", encoding="utf-8") as f:
        json.dump({"data": [new_module]}, f, indent=2)
