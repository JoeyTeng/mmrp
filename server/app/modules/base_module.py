from dataclasses import dataclass
from abc import ABC, abstractmethod
from typing import Literal, Optional, Any, TypeVar, Generic
import numpy as np

ParameterType = TypeVar(
    "ParameterType",
    bound=int | float | str | bool,
    covariant=True,  # important here
)


# Definition of module parameters
@dataclass
class ParameterDefinition(Generic[ParameterType]):
    name: str
    type: Literal["int", "float", "str", "bool"]
    valid_values: tuple[ParameterType, ParameterType] | list[ParameterType] | None = (
        None
    )
    description: Optional[str] = None
    default: Optional[Any] = None
    required: bool = True


# Base class of a module
class ModuleBase(ABC):
    name: str

    @abstractmethod
    def get_parameters(self) -> list[ParameterDefinition[Any]]:
        return []

    @abstractmethod
    def process(self, input_data: str, parameters: dict[str, Any]) -> None:
        raise NotImplementedError

    @abstractmethod
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, Any]
    ) -> np.ndarray:
        raise NotImplementedError
