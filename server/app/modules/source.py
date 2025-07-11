from typing import Any
from app.modules.base_module import (
    ModuleBase,
    ParameterDefinition,
    FormatDefinition,
    ModuleRole,
)
from app.utils.shared_functionality import get_video_path


class Source(ModuleBase):
    name = "source"

    role = ModuleRole.INPUT_NODE

    def get_parameters(self) -> list[ParameterDefinition[Any]]:
        return [
            ParameterDefinition(
                name="path",
                type="str",
                required=True,
                default="example-video.mp4",
                description="Filesystem path to the input .mp4 video",
            )
        ]

    def get_input_formats(self) -> list[FormatDefinition]:
        # No upstream inputs
        return []

    def get_output_formats(self) -> list[FormatDefinition]:
        # We support .mp4 imports (decoded by OpenCV as BGR24)
        # Width/height/fps will be resolved at runtime by the pipeline runner
        return [
            FormatDefinition(
                pixel_format="bgr24",  # default in openCV
                color_space="BT.709 Full",
                width=None,
                height=None,
                frame_rate=None,
            )
        ]

    def process_frame(self, frame: Any, parameters: dict[str, Any]) -> Any:
        # Source frames are injected by the pipeline service, never called directly
        raise NotImplementedError("Frame injection is handled by the pipeline service")

    # Process video path
    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        return str(get_video_path(str(parameters["path"])))
