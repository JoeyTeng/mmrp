from enum import StrEnum


class ModuleRole(StrEnum):
    INPUT_NODE = "inputNode"
    PROCESS_NODE = "processNode"
    OUTPUT_NODE = "outputNode"
