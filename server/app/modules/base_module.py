from dataclasses import dataclass
from typing import Literal, Optional, Any
import numpy as np

# Definition of module parameters
@dataclass
class ParameterDefinition:
    name: str
    type: Literal["int", "float", "str", "bool"]
    description: Optional[str] = None
    default: Optional[Any] = None
    min: Optional[float] = None
    max: Optional[float] = None
    choices: Optional[list[Any]] = None
    required: bool = True

# Base class of a module
class ModuleBase:
    name: str
    
    def get_parameters(self) -> list[ParameterDefinition]:
        return []

    def process(self, input_data, parameters: dict):
        raise NotImplementedError
    
    def process_frame(self, frame: np.ndarray, parameters: dict) -> np.ndarray:
        raise NotImplementedError