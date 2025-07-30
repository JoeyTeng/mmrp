from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
import numpy as np
from app.schemas.module import (
    ModuleData,
    ModuleFormat,
    ModuleParameter,
    ParameterConstraint,
    ParameterMetadata,
    Position,
)


class ModuleBase(BaseModel, ABC):
    id: str = Field(..., description="Unique Module Identifier -ID")
    name: str = Field(..., description="Module name in pipeline")
    type: str = Field(..., description="Module type in pipeline")
    position: Position = Field(
        default_factory=lambda: Position(x=0, y=0),
        description="Position in workspace (defaults to 0,0 if not provided)",
    )
    data: ModuleData = Field(
        ...,
        description="Module-specific Data including constraints and formats",
    )

    parameter_model: Any = Field(..., exclude=True)
    model_config = ConfigDict(extra="forbid", validate_assignment=True, frozen=False)

    @model_validator(mode="before")
    def parse_raw_parameters(cls, values: dict[str, Any]) -> dict[str, Any]:
        data = values["data"]
        parameters_ = data.get("parameters", [])

        data["parameters"] = []
        for param_ in parameters_:
            # Validate and enrich parameter constraints
            constraint = ParameterConstraint.model_validate(param_)

            # Metadata for the parameter
            metadata = ParameterMetadata(
                type=param_["type"],
                value=param_.get("default", constraint.default),
                constraints=constraint,
            )

            # Parameter
            parameter_ = ModuleParameter(name=param_["name"], metadata=metadata)
            data["parameters"].append(parameter_)

        values["data"] = ModuleData(parameters=data["parameters"])
        return values

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self._enrich_data()

    def _enrich_data(self) -> None:
        self.data.input_formats = self.get_input_formats()
        self.data.output_formats = self.get_output_formats()

    @abstractmethod
    def get_parameters(self) -> list[ModuleParameter]:
        pass

    @abstractmethod
    def get_input_formats(self) -> list[ModuleFormat]:
        pass

    @abstractmethod
    def get_output_formats(self) -> list[ModuleFormat]:
        pass

    @abstractmethod
    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        pass

    @abstractmethod
    def process_frame(
        self, frame: np.ndarray[Any], parameters: dict[str, Any]
    ) -> np.ndarray[Any]:
        pass
