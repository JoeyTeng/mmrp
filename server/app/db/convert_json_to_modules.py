import json
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from pydantic import ValidationError
from app.modules.inputs.video_source import VideoSource
from app.modules.outputs.video_output import VideoOutput
from app.modules.transforms.blur import BlurModule
from app.modules.transforms.color_space import ColorspaceModule
from app.modules.transforms.resize import ResizeModule
from app.modules.generic.binary_module import GenericBinaryModule
from app.modules.utils.enums import ModuleName
from app.schemas.module import Position
from app.modules.module import ModuleBase


def get_json_path() -> Path:
    return Path(__file__).parent / "mock_test.json"


def load_modules_from_json(file_path: Optional[Path] = None) -> List[ModuleBase]:
    path = file_path if file_path is not None else get_json_path()

    with open(path) as f:
        json_data: Dict[str, Any] = json.load(f)
    return json_to_modules(json_data)


def generate_module_uuid(module_name: str) -> str:
    id = uuid.uuid4()
    return f"{module_name}-{id}"


def json_to_modules(json_data: Dict[str, Any]) -> List[ModuleBase]:
    module_classes: Dict[ModuleName, type[ModuleBase]] = {
        ModuleName.VIDEO_SOURCE: VideoSource,
        ModuleName.COLOR_SPACE: ColorspaceModule,
        ModuleName.BLUR: BlurModule,
        ModuleName.RESIZE: ResizeModule,
        ModuleName.RESULT: VideoOutput,
    }

    modules: List[ModuleBase] = []

    for module_data in json_data.get("data", []):
        try:
            name_ = module_data["name"]
            type_ = module_data["type"]
            parameters_ = module_data.get("parameters", [])
            module_id = generate_module_uuid(name_)
            position_ = Position(x=0.0, y=0.0)

            try:
                module_class = module_classes[name_]
            except KeyError:
                module_class = GenericBinaryModule

            module = module_class(
                id=module_id,
                name=name_,
                type=type_,
                position=position_,
                data={
                    "parameters": parameters_,
                },
            )

            modules.append(module)
        except KeyError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required field in module data: {str(e)}",
            )
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Validation error in module {module_data.get('id')}: {e.errors()}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error loading module {module_data.get('id')}: {str(e)}",
            )
    return modules


def get_all_mock_modules() -> List[ModuleBase]:
    try:
        return load_modules_from_json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load mock modules: {str(e)}"
        )
