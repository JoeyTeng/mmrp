import json
from fastapi import APIRouter, HTTPException
from typing import Any
from pathlib import Path
import platform

router = APIRouter(
    prefix="/binaries",
    tags=["binaries"],
    responses={404: {"description": "Not Found"}},
)

BASE_DIR: Path = Path(__file__).resolve().parents[2]
BINARIES_DIR: Path = BASE_DIR / "binaries"


# Returns all binaries and their parameters
@router.get("/")
def get_all_binaries() -> list[dict[str, Any]]:
    binaries: list[dict[str, Any]] = []

    for binary_dir in BINARIES_DIR.iterdir():
        if not binary_dir.is_dir():
            continue
        # Determine OS and choose binary accordingly
        match platform.system():
            case "Windows":
                exe_path = binary_dir / "Windows-AMD64"
            case "Linux":
                exe_path = binary_dir / "Linux-x86_64"
            case "Darwin":
                exe_path = binary_dir / "Darwin-arm64"
            case _:
                raise HTTPException(
                    status_code=500,
                    detail="Unsupported operating system. Only Windows, Linux, and macOS are supported.",
                )
        if not exe_path.exists():
            continue
        config_path = exe_path / "config.json"
        if not config_path.exists():
            continue

        try:
            with open(config_path, "r") as f:
                config = json.load(f)
        except json.JSONDecodeError:
            continue

        binaries.append(
            {
                "name": config.get("name", exe_path.name),
                "parameters": config.get("parameters", []),
            }
        )

    return binaries
