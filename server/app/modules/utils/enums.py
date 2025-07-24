from enum import StrEnum


class ModuleName(StrEnum):
    VIDEO_SOURCE = "video_source"
    COLOR = "color"
    BLUR = "blur"
    RESIZE = "resize"
    RESULT = "result"


class ModuleType(StrEnum):
    INPUT_NODE = "inputNode"
    PROCESS_NODE = "processNode"
    OUTPUT_NODE = "outputNode"


class ParameterType(StrEnum):
    STRING = "str"
    INTEGER = "int"
    FLOAT = "float"
    BOOLEAN = "boolean"
    SELECT = "select"
    FILE = "file"
    DIRECTORY = "directory"


class PixelFormat(StrEnum):
    BGR24 = "bgr24"
    RGB24 = "rgb24"
    GRAY8 = "gray8"
    YUV420P_8BIT = "yuv420p 8bit"
    YUV420P_10BIT = "yuv420p 10bit"
    YUV444P_8BIT = "yuv444p 8bit"


class ColorSpace(StrEnum):
    BT_601_FULL = "BT.601 Full"
    BT_601_LIMITED = "BT.601 Limited"
    BT_709_FULL = "BT.709 Full"
    BT_709_LIMITED = "BT.709 Limited"


class Color(StrEnum):
    YCbCr = "YCbCr"
    HSV = "HSV"
    LAB = "LAB"
    RGB = "RGB"
    BGR = "BGR"


class ResizeInterpolation(StrEnum):
    NEAREST = "nearest"
    LINEAR = "linear"
    CUBIC = "cubic"
    AREA = "area"
    LANCZOS4 = "lanczos4"


class BlurAlgorithm(StrEnum):
    GAUSSIAN = "gaussian"
    MEDIAN = "median"
    BILATERAL = "bilateral"


class ColorConversion(StrEnum):
    BGR2GRAY = "bgr2gray"
    RGB2BGR = "rgb2bgr"
    # Add more conversions based on your needs


class VideoCodec(StrEnum):
    LIBX264 = "libx264"
    LIBX265 = "libx265"
    VP8 = "vp8"
    VP9 = "vp9"
    AV1 = "av1"
    COPY = "copy"  # passthrough without re-encoding


class FrameRate(StrEnum):
    FPS_23_976 = "23.976"  # NTSC film standard
    FPS_24 = "24"  # Film standard
    FPS_25 = "25"  # PAL standard
    FPS_29_97 = "29.97"  # NTSC standard
    FPS_30 = "30"  # Progressive video
    FPS_48 = "48"  # High frame rate
    FPS_50 = "50"  # PAL high frame rate
    FPS_59_94 = "59.94"  # NTSC high frame rate
    FPS_60 = "60"  # Progressive high frame rate
    FPS_120 = "120"  # Ultra high frame rate
    FPS_240 = "240"  # Slow motion capture
