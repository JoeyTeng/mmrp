import subprocess
import platform
import json
import cv2
from pathlib import Path
from typing import Any
from app.utils.shared_functionality import as_context


# Decode a video file to a specified output format such as YUV
def decode_video(video_path: Path, input_colorspace: str, output_format: str = "yuv"):
    video = str(video_path)
    output_path = str(video_path.parent / f"{video_path.stem}.{output_format}")

    # Use this to map output format to OpenCV constants
    # TODO: Add more formats if needed
    match output_format:
        case "yuv":
            output: str = "YUV_I420"
        case _:
            output: str = "YUV_I420"

    # Video capture setup
    cv2VideoCaptureContext = as_context(cv2.VideoCapture, lambda cap: cap.release())

    with cv2VideoCaptureContext(video) as cap:
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        with open(output_path, "wb") as out_file:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                constant_name = f"COLOR_{input_colorspace}2{output}"
                if not hasattr(cv2, constant_name):
                    raise ValueError(
                        f"Unsupported conversion: {input_colorspace} to {output}"
                    )
                color = getattr(cv2, constant_name)
                output_frame = cv2.cvtColor(frame, color)
                out_file.write(output_frame.tobytes())

    return output_path, (width, height)


# Function to execute a specified binary with given parameters
def execute_binary(binary_name: str, video_name: str, args: dict[str, Any]):
    base_dir = Path(__file__).resolve().parents[2]
    binary_dir = base_dir / "binaries" / binary_name

    # Get video and transform it to yuv
    video = base_dir / "videos" / video_name
    if not video.exists():
        raise FileNotFoundError(f"Video file not found: {video}")
    yuv, dim = decode_video(video, "BGR", "yuv")

    # Resolve input and output paths
    input_path = base_dir / "videos" / yuv
    output_dir = base_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "output.yuv"

    # Detect OS and choose binary accordingly
    exe_path: Path = binary_dir / f"{platform.system()}-{platform.machine()}"
    if not exe_path.exists():
        raise FileNotFoundError(f"Executable path not found: {exe_path}")

    if platform.system() in {"Linux", "Darwin"}:
        exe = exe_path / f"{binary_name}"
        subprocess.run(["chmod", "+x", str(exe)], check=True)
    else:
        exe = exe_path / f"{binary_name}.exe"

    if not exe.exists():
        raise FileNotFoundError(f"Executable not found: {exe}")

    # Load parameter config
    config_path = exe_path / "config.json"
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError(f"Invalid JSON in config file: {config_path}")

    # Build command
    command = [str(exe)]

    for param in config["parameters"]:
        name = param["name"]
        flag = param["flag"]
        param_type = param["type"]
        required = param.get("required", False)

        # Handle parameters
        if name == "input":
            value = str(input_path)
        elif name == "output":
            value = str(output_path)
        else:
            if name not in args:
                if required:
                    raise ValueError(f"Missing required parameter: {name}")
                continue
            value = args[name]

        # Boolean flags (e.g., --verbose)
        if param_type == "bool":
            if value:
                command.append(flag)
        else:
            command += [flag, str(value)]

    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("STDOUT:", result.stdout)
        print("Output dimensions:", dim)
        print("STDERR:", result.stderr)
    except subprocess.CalledProcessError as e:
        print("Execution failed:")
        print("STDOUT:\n", e.stdout)
        print("STDERR:\n", e.stderr)
        raise


if __name__ == "__main__":
    # Example usage
    # TODO: Integrate binary execution in pipeline processing or other processing enpoints
    binary_name = "simple-video-processor-app"
    video_name = "example-video.mp4"
    args: dict[str, Any] = {
        "width": 1280,
        "height": 720,
        "mode": 1,
        "operator": 2,
        "y": 1,
        "u": 1,
        "v": 1,
        "verbose": True,
    }  # Example arguments

    execute_binary(binary_name, video_name, args)
