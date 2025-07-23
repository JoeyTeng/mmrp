from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
import numpy as np
from app.schemas.module import ModuleFormat, ModuleParameter, ParameterMetadata, Position
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
            "parameters": [],
            "input_formats": [],
            "output_formats": [],
        },
        description="Module-specific Data including constraints and formats",
    )

    model_config = ConfigDict(extra="forbid", validate_assignment=True, frozen=False)

    @model_validator(mode="before")
    def parse_raw_parameters(_, values: Dict[str, Any]) -> Dict[str, Any]:
        data = values.get("data", {})
        raw_params = data.get("parameters", [])

        name = values.get("name")
        if isinstance(name, ModuleName):
            name = name.value

        # Get constraints for the module name
        param_constraints = MODULE_CONSTRAINTS.get(name, {})

        # Enrich parameters with constraints
        data["parameters"] = [
            ModuleParameter(
                name = param["name"],
                metadata = ParameterMetadata(
                    value = param.get("default", None),
                    type =param.get("type"),
                    constraints= param_constraints.get(param["name"], {})
                    .get("constraints", None)
                    .model_dump(exclude_none=True)
                    if param_constraints.get(param["name"])
                    else None,
                ),
            )
            for param in raw_params
        ]

        values["data"] = data
        return values

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self._enrich_data()

    def _enrich_data(self) -> None:
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
