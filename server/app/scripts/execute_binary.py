import subprocess
import platform
import json
from pathlib import Path
from typing import Any


# Function to execute a specified binary with given parameters
def execute_binary(binary_name: str, video_name: str, args: dict[str, Any]):
    base_dir = Path(__file__).resolve().parents[2]

    # Resolve input and output paths
    input_path = base_dir / "videos" / video_name
    output_dir = base_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "output.yuv"

    # Detect OS and choose binary accordingly
    is_windows = platform.system() == "Windows"
    exe_name = (
        "simple-video-processor-app.exe" if is_windows else "simple-video-processor-app"
    )
    binary: Path = base_dir / "binaries" / binary_name
    exe_path = binary / exe_name

    if not exe_path.exists():
        raise FileNotFoundError(f"Executable not found: {exe_path}")

    # Ensure executable permission on Linux/macOS
    if not is_windows:
        subprocess.run(["chmod", "+x", str(exe_path)], check=True)

    # Load parameter config
    config_path = binary / "config.json"
    with open(config_path, "r") as f:
        config = json.load(f)

    # Build command
    command = [str(exe_path)]

    for param in config["parameters"]:
        name = param["name"]
        flag = param["flag"]
        param_type = param["type"]
        required = param.get("required", False)

        # Handle special names for input/output
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
    video_name = "bus_cif.yuv"
    args: dict[str, Any] = {
        "input": "bus_cif.yuv",
        "width": 1280,
        "height": 720,
        "mode": 1,
        "operator": 2,
        "y": 1,
        "u": 1,
        "v": 1,
        "output": "four.yuv",
        "verbose": True,
    }  # Example arguments

    execute_binary(binary_name, video_name, args)
