import json
from fastapi import APIRouter
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
        exe_path: Path = binary_dir / f"{platform.system()}-{platform.machine()}"
        if not exe_path.exists():
            continue

        # Get config file for parameters
        config_path = exe_path / "config.json"
        if not config_path.exists():
            continue

        try:
            with open(config_path, "r") as f:
                config = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue

        binaries.append(
            {
                "name": config.get("name", exe_path.name),
                "parameters": config.get("parameters", []),
            }
        )

    return binaries
