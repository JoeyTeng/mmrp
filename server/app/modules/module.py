from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import numpy as np
from app.schemas.module import ModuleFormat, ModuleParameter, Position
from app.modules.utils.enums import ModuleName
from app.modules.utils.constraints import MODULE_CONSTRAINTS


class ModuleBase(BaseModel, ABC):
    id: str = Field(..., description="Unique Module Identifier -ID")
    name: Any = Field(..., description="Module name in pipeline")
    type: Any = Field(..., description="Module type in pipeline")
    position: Position = Field(
        default_factory=lambda: Position(x=0, y=0),
        description="Position in workspace (defaults to 0,0 if not provided)",
    )
    data: Dict[str, Any] = Field(
        default_factory=lambda: {
            "parameters": List[ModuleParameter],
            "input_formats": [],
            "output_formats": [],
        },
        description="Module-specific Data including constraints and formats",
    )

    model_config = ConfigDict(extra="forbid", validate_assignment=True, frozen=False)

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self._enrich_data()

    def _enrich_data(self) -> None:
        name_value = self.name.value if isinstance(self.name, ModuleName) else self.name
        constraints = MODULE_CONSTRAINTS.get(name_value, {})
        self.data.setdefault("parameters", [])

        # Enrich parameters with constraints
        self.data["parameters"] = [
            {
                "name": param["name"],
                "metadata": {
                    "value": param.get("default", None),
                    "type": param.get("type", None),
                    "constraints": constraints.get(param["name"], {})
                    .get("constraints", None)
                    .model_dump(exclude_none=True)
                    if constraints.get(param["name"])
                    else None,
                },
            }
            for param in self.data["parameters"]
        ]

        # Add formats
        self.data.update(
            {
                "input_formats": [
                    fmt.model_dump(exclude_none=True)
                    for fmt in self.get_input_formats()
                ],
                "output_formats": [
                    fmt.model_dump(exclude_none=True)
                    for fmt in self.get_output_formats()
                ],
            }
        )

    @abstractmethod
    def get_parameters(self) -> Dict[str, ModuleParameter]:
        pass

    @abstractmethod
    def get_input_formats(self) -> List[ModuleFormat]:
        pass

    @abstractmethod
    def get_output_formats(self) -> List[ModuleFormat]:
        pass

    @abstractmethod
    def process(self, input_data: Any, parameters: Dict[str, Any]) -> Any:
        pass

    @abstractmethod
    def process_frame(
        self, frame: np.ndarray[Any], parameters: Dict[str, Any]
    ) -> np.ndarray[Any]:
        pass
