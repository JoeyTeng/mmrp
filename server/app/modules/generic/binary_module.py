import numpy as np
from app.modules.module import ModuleBase
from typing import Any, override
from app.schemas.module import GenericParameterModel, ModuleFormat, ModuleParameter


class GenericBinaryModule(ModuleBase):
    parameter_model: Any = GenericParameterModel

    @override
    def get_parameters(self) -> list[ModuleParameter]:
        return self.data.parameters

    @override
    def get_input_formats(self) -> list[ModuleFormat]:
        return self.data.input_formats or []

    @override
    def get_output_formats(self) -> list[ModuleFormat]:
        return self.data.output_formats or []

    @override
    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        pass

    @override
    def process_frame(self, frame: np.ndarray, parameters: dict[str, Any]) -> Any:
        pass
