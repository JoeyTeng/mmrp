import numpy as np
from app.modules.module import ModuleBase
from typing import Any, override
from app.schemas.module import GenericParameterModel, ModuleFormat, ModuleParameter
from pathlib import Path
from app.utils.shared_functionality import (
    decode_video,
    write_yuv420_frame,
    read_yuv420_frame,
)
from app.utils.enums import VideoFormats
import platform
import subprocess
import json
import tempfile
import os

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

    # Input data is expected to be the video name
    @override
    def process(self, input_data: Any, parameters: dict[str, Any]) -> Any:
        # Get video and transform it to yuv
        video = BASE_DIR / "videos" / input_data
        if not video.exists():
            raise FileNotFoundError(f"Video file not found: {video}")
        yuv = decode_video(video, VideoFormats.BGR, VideoFormats.YUV_I420)

        output_dir = BASE_DIR / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / "output.yuv"

        output_yuv = self.execute_binary(parameters, yuv, output_path)
        return output_yuv

    @override
    def process_frame(
        self, frame: np.ndarray, parameters: dict[str, Any]
    ) -> np.ndarray:
        width, height = frame.shape[1], frame.shape[0]

        fd_in, input_path_raw = tempfile.mkstemp(suffix=".yuv")
        fd_out, output_path_raw = tempfile.mkstemp(suffix=".yuv")
        os.close(fd_in)
        os.close(fd_out)

        input_path = Path(input_path_raw)
        output_path = Path(output_path_raw)

        try:
            # 1. Write input frame
            write_yuv420_frame(frame, input_path)

            # 2. Run binary
            out = self.execute_binary(parameters, input=input_path, output=output_path)

            # 3. Read processed frame
            result_frame = read_yuv420_frame(out, width, height)

        finally:
            input_path.unlink(missing_ok=True)
            output_path.unlink(missing_ok=True)

        return result_frame

    # Function that executes the binary
    def execute_binary(
        self, parameters: dict[str, Any], input: Path, output: Path
    ) -> Any:
        if self.executable_path is None:
            raise FileNotFoundError("Executable path is not defined")
        binary_name: str = self.executable_path
        base_dir = Path(__file__).resolve().parents[3]
        binary_dir = base_dir / "binaries" / binary_name

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
                elif parameters[name] is None:
                    continue
                value = parameters[name]

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

        return output
