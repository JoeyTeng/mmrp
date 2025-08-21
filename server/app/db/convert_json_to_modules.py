import json
import uuid
from pathlib import Path
from typing import Any
from pydantic import ValidationError
from app.modules.inputs.video_source import VideoSource
from app.modules.outputs.video_output import VideoOutput
from app.modules.transforms.blur import BlurModule
from app.modules.transforms.color import ColorModule
from app.modules.transforms.resize import ResizeModule
from app.modules.generic.binary_module import GenericBinaryModule
from app.modules.utils.enums import ModuleName
from app.schemas.module import ModuleData, Position
from app.modules.module import ModuleBase
from app.services.module_registry import ModuleRegistry
from app.utils.shared_functionality import string_sanitizer
from app.services.modules import append_to_mock_data


def get_json_folder() -> Path:
    return Path(__file__).parent / "json_data"


def convert_json(folder: Path) -> list[ModuleBase]:
    modules: list[ModuleBase] = []

    for json_file in folder.glob("*.json"):
        with json_file.open("r", encoding="utf-8") as f:
            try:
                json_data: dict[str, Any] = json.load(f)
            except json.JSONDecodeError as e:
                raise ValueError(f"Error parsing JSON: {str(e)}")
            mods = json_to_modules(json_data)
            modules.extend(mods)

    return modules


def load_binary_modules(binaries_dir: Path) -> Path:
    out_path = Path(__file__).resolve().parent / "json_data" / "binaries"
    out_path.mkdir(parents=True, exist_ok=True)

    # Save binary config
    for binary in binaries_dir.iterdir():
        if not binary.is_dir():
            continue

        config_path = binary / "Linux-x86_64" / "config.json"
        if not config_path.exists():
            continue

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config_data = json.load(f)

            append_to_mock_data(config_data, out_path)
            print(f"Processed {config_path}")
        except Exception as e:
            print(f"Failed to process {config_path}: {e}")

    return out_path


def get_all_mock_modules() -> list[ModuleBase]:
    json_folder = get_json_folder()
    all_modules: list[ModuleBase] = []

    all_modules.extend(convert_json(json_folder))

    # If binaries exist, save binaries config in mock_data json
    # and register these modules alongside the existing ones
    binaries_dir = Path(__file__).resolve().parents[2] / "binaries"
    if binaries_dir.exists():
        # Add data to mock data json
        binaries_folder = load_binary_modules(binaries_dir)
        # Read from newly created mock_data
        all_modules.extend(convert_json(binaries_folder))

    return all_modules


def generate_module_uuid() -> str:
    return f"{uuid.uuid4()}"


def json_to_modules(json_data: dict[str, Any]) -> list[ModuleBase]:
    module_classes: dict[ModuleName, type[ModuleBase]] = {
        ModuleName.VIDEO_SOURCE: VideoSource,
        ModuleName.COLOR: ColorModule,
        ModuleName.BLUR: BlurModule,
        ModuleName.RESIZE: ResizeModule,
        ModuleName.RESULT: VideoOutput,
    }

    modules: list[ModuleBase] = []

    for module_data in json_data.get("data", []):
        try:
            module_class_ = module_data["name"]
            name_ = string_sanitizer(module_class_)
            type_ = module_data["type"]
            parameters_ = module_data.get("parameters", [])
            input_formats_ = module_data.get("input_formats", [])
            output_formats_ = module_data.get("output_formats", [])
            module_id = generate_module_uuid()
            position_ = Position(x=0.0, y=0.0)
            data_ = ModuleData(
                name=name_,
                module_class=module_class_,
                parameters=parameters_,
                input_formats=input_formats_,
                output_formats=output_formats_,
            )
            exectuable_path_ = module_data.get("executable_path", None)

            module_class = module_classes.get(module_class_, GenericBinaryModule)

            module = module_class(
                id=module_id,
                type=type_,
                position=position_,
                data=data_,
                executable_path=exectuable_path_,
            )

            ModuleRegistry.register(module)
            modules.append(module)
        except KeyError as e:
            raise ValueError(
                f"Missing required field in module data: {str(e)} - module_data: {module_data}"
            )
        except ValidationError as e:
            raise ValueError(
                f"Validation error in module: {module_data} : {e.errors()}"
            )
        except Exception as e:
            raise ValueError(f"Error loading module: {module_data}: {str(e)}")
    return modules
