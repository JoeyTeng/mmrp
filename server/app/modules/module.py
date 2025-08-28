from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field, ConfigDict
import numpy as np
from app.schemas.module import (
    ModuleData,
    ModuleFormat,
    ModuleParameter,
    Position,
)


class ModuleBase(BaseModel, ABC):
    id: str = Field(..., description="Unique Module Identifier -ID")
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
    executable_path: str | None = Field()

    model_config = ConfigDict(extra="forbid", validate_assignment=True, frozen=False)

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)

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
    def process(
        self, input_data: Any, parameters: dict[str, Any], session_id: str
    ) -> Any:
        pass

    @abstractmethod
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, Any]
    ) -> np.ndarray[Any]:
        pass
