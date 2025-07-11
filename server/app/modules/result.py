from typing import Any
from app.modules.base_module import (
    ModuleBase,
    ParameterDefinition,
    FormatDefinition,
    ModuleRole,
)
from pathlib import Path


# visual purpose
class Result(ModuleBase):
    name = "result"

    role = ModuleRole.OUTPUT_NODE

    def get_parameters(self) -> list[ParameterDefinition[Any]]:
        return [
            ParameterDefinition(
                name="path",
                type="str",
                required=False,
                description="Optional output .mp4 file path",  # for now, we can choose to remove this if output path will be hardcoded
                default="example_output.webm",
            )
        ]

    def get_input_formats(self) -> list[FormatDefinition]:
        # Accept whatever the pipeline hands it (we only decode/write BGR24 i OpenCV)
        return [
            FormatDefinition(
                pixel_format="bgr24",
                color_space="BT.709 Full",
                width=None,
                height=None,
                frame_rate=None,
            )
        ]

    def get_output_formats(self) -> list[FormatDefinition]:
        # No downstream consumers
        return []

    def process_frame(self, frame: Any, parameters: dict[str, Any]) -> Any:
        # Pass‐through
        raise NotImplementedError

    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        output_video: str = str(parameters["path"])
        output_path = (
            Path(__file__).resolve().parent.parent.parent / "output" / f"{output_video}"
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        return str(output_path)
