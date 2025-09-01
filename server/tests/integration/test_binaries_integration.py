import json
import platform
from typing import Any
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from main import app
from _pytest.monkeypatch import MonkeyPatch
from app.routers import binaries as binaries_router


# FastAPI TestClient fixture
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# Patch BINARIES_DIR to a temporary folder and create mock binaries/configs
@pytest.fixture
def setup_binaries(tmp_path: Path, monkeypatch: MonkeyPatch) -> Path:
    # Patch BINARIES_DIR
    monkeypatch.setattr(binaries_router, "BINARIES_DIR", tmp_path)

    # Create a mock binary directory
    binary_name = "example_binary"
    binary_dir = tmp_path / binary_name
    binary_dir.mkdir()

    # Create OS/machine specific folder
    exe_dir = binary_dir / f"{platform.system()}-{platform.machine()}"
    exe_dir.mkdir(parents=True)

    # Create a config.json with type annotations
    config: dict[str, Any] = {
        "name": "Example Binary",
        "parameters": [{"key": "--input", "type": "str", "default": "input.txt"}],
    }
    config_path = exe_dir / "config.json"
    with open(config_path, "w") as f:
        json.dump(config, f)

    return tmp_path


# Test /binaries endpoint returns all binaries with valid configs
def test_get_all_binaries_success(setup_binaries: Path, client: TestClient):
    # Act
    response = client.get("/api/binaries/")

    # Assert
    assert response.status_code == 200
    data: list[dict[str, Any]] = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    binary = data[0]
    assert binary["name"] == "Example Binary"
    assert isinstance(binary["parameters"], list)
    assert binary["parameters"][0]["key"] == "--input"


# Test /binaries endpoint handles missing config.json gracefully
def test_get_all_binaries_missing_config(
    tmp_path: Path, client: TestClient, monkeypatch: MonkeyPatch
):
    # Arrange
    # Patch BINARIES_DIR to an empty folder
    monkeypatch.setattr(binaries_router, "BINARIES_DIR", tmp_path)

    # Create binary folder but no config.json
    binary_dir = tmp_path / "example_binary"
    binary_dir.mkdir()
    import platform

    exe_dir = binary_dir / f"{platform.system()}-{platform.machine()}"
    exe_dir.mkdir()

    # Act
    response = client.get("/api/binaries/")

    # Assert: should return empty list because config.json missing
    assert response.status_code == 200
    data = response.json()
    assert data == []


# Test /binaries endpoint skips invalid JSON configs
def test_get_all_binaries_invalid_json(
    tmp_path: Path, client: TestClient, monkeypatch: MonkeyPatch
):
    # Arrange
    # Patch BINARIES_DIR
    monkeypatch.setattr(binaries_router, "BINARIES_DIR", tmp_path)

    # Create binary + config.json with invalid JSON
    binary_dir = tmp_path / "bad_binary"
    binary_dir.mkdir()
    import platform

    exe_dir = binary_dir / f"{platform.system()}-{platform.machine()}"
    exe_dir.mkdir()
    with open(exe_dir / "config.json", "w") as f:
        f.write("{ invalid json }")

    # Act
    response = client.get("/api/binaries/")

    # Assert: should skip bad JSON, returning empty list
    assert response.status_code == 200
    data = response.json()
    assert data == []
