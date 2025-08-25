import numpy as np
from app.modules.module import ModuleBase
from typing import Any, override
from app.schemas.module import GenericParameterModel, ModuleFormat, ModuleParameter
from pathlib import Path
import platform
import subprocess
import json
from app.utils.shared_functionality import create_filename_base
from app.schemas.video import VideoMetadata

BASE_DIR = Path(__file__).resolve().parents[3]


class GenericBinaryModule(ModuleBase):
    parameter_model: Any = GenericParameterModel

    @override
    def get_parameters(self) -> list[ModuleParameter]:
        return self.data.parameters

    @override
    def get_input_formats(self) -> list[ModuleFormat]:
        return self.data.input_formats or []

    @override
    def get_output_formats(self) -> list[ModuleFormat]:
        return self.data.output_formats or []

    # Input data is expected to be the input video file path and output path (directory)
    @override
    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        in_path = Path(input_data["input"])
        out_dir = Path(input_data["output"])
        if not in_path.exists():
            raise FileNotFoundError(in_path)
        out_path = out_dir / f"{create_filename_base(self.id)}.yuv"

        video_data = VideoMetadata(
            path=in_path,
            width=input_data["width"],
            height=input_data["height"],
            fps=input_data["fps"],
        )

        output = self.execute_binary(parameters, video_data, out_path)
        return output

    @override
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, Any]
    ) -> np.ndarray:
        raise NotImplementedError(
            "Binary module process entire videos, not individual frames"
        )

    # Function that executes the binary
    def execute_binary(
        self, parameters: dict[str, Any], input: VideoMetadata, output: Path
    ) -> VideoMetadata:
        if self.executable_path is None:
            raise FileNotFoundError("Executable path is not defined")
        binary_name: str = self.executable_path
        binary_dir = BASE_DIR / "binaries" / binary_name

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

        # Go through all expected parameters
        for param in config["parameters"]:
            name = param["name"]
            flag = param["flag"]
            param_type = param["type"]
            required = param.get("required", False)

            # Handle parameters
            if name == "input":
                value = str(input)
            elif name == "output":
                value = str(output)
            else:
                if name not in parameters:
                    if required:
                        raise ValueError(f"Missing required parameter: {name}")
                    continue
                value = parameters[name]

            # Check if output width/height/fps have been provided and update output metadata
            if flag == "-wout":
                input.width = int(value)
            elif flag == "-hout":
                input.height = int(value)
            elif flag == "-fps":
                input.fps = float(value)

            # Boolean flags (e.g., --verbose)
            if param_type == "bool":
                if value:
                    command.append(flag)
            else:
                command += [flag, str(value)]

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            print("STDOUT:", result.stdout)
        except subprocess.CalledProcessError as e:
            print("Execution failed:")
            print("STDOUT:\n", e.stdout)
            print("STDERR:\n", e.stderr)
            raise

        output_metadata = VideoMetadata(
            path=output, width=input.width, height=input.height, fps=input.fps
        )

        return output_metadata
