from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
import numpy as np
from app.schemas.module import (
    ModuleFormat,
    ModuleParameter,
    ParameterConstraint,
    ParameterMetadata,
    Position,
)


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
    def parse_raw_parameters(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        data = values["data"]
        parameters_ = data.get("parameters", [])

        data["parameters"] = []
        for param_ in parameters_:
            # Validate and enrich parameter constraints
            constraint = ParameterConstraint.model_validate(
                {
                    k: v
                    for k, v in param_.items()
                    if k in ParameterConstraint.model_fields
                }
            )

            # Metadata for the parameter
            metadata = ParameterMetadata(
                type=param_["type"],
                value=param_.get("default", constraint.default),
                constraints=constraint,
            )

            # Parameter
            parameter_ = ModuleParameter(name=param_["name"], metadata=metadata)
            data["parameters"].append(parameter_.model_dump())

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
    def get_parameters(self) -> List[ModuleParameter]:
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
