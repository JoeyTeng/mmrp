import numpy as np
from app.modules.module import ModuleBase
from typing import Any, List, Dict
from app.schemas.module import GenericParameterModel, ModuleFormat, ModuleParameter


class GenericBinaryModule(ModuleBase):
    name: str
    type: str

    parameter_model: Any = GenericParameterModel

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)

    def get_parameters(self) -> List[ModuleParameter]:
        return self.data["parameters"]

    def get_input_formats(self) -> List[ModuleFormat]:
        return []

    def get_output_formats(self) -> List[ModuleFormat]:
        return []

    def process(self, input_data: Any, parameters: Dict[str, Any]) -> Any:
        pass

    def process_frame(self, frame: np.ndarray[Any], parameters: Dict[str, Any]) -> Any:
        pass
