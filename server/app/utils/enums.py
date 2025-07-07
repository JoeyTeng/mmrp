from enum import StrEnum


class ModuleRole(StrEnum):
    INPUT_NODE = "inputNode"
    PROCESS_NODE = "processNode"
    OUTPUT_NODE = "outputNode"


class PixelFormats(StrEnum):
    BGR24 = "bgr24"
    RGB24 = "rgb24"
    GRAY8 = "gray8"
    YUV420P_8BIT = "yuv420p 8bit"
    YUV420P_10BIT = "yuv420p 10bit"
    YUV444P_8BIT = "yuv444p 8bit"


class ColorSpaces(StrEnum):
    BT_601_FULL = "BT.601 Full"
    BT_601_LIMITED = "BT.601 Limited"
    BT_709_FULL = "BT.709 Full"
    BT_709_LIMITED = "BT.709 Limited"
