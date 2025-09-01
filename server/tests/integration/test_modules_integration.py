import json
import io
from pathlib import Path
from typing import Any
import pytest
from _pytest.monkeypatch import MonkeyPatch
from fastapi.testclient import TestClient
from main import app
from app.routers import modules as modules_router
from app.db import convert_json_to_modules
import app.services.modules as services_modules


# FastAPI TestClient fixture
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# Fixture that patches all module storage (binaries + JSON configs) to tmp_path
@pytest.fixture
def patched_dirs(tmp_path: Path, monkeypatch: MonkeyPatch):
    # Patch binaries directory
    monkeypatch.setattr(modules_router, "BINARIES_DIR", tmp_path)

    # Patch JSON read folder
    monkeypatch.setattr(convert_json_to_modules, "get_json_folder", lambda: tmp_path)

    # Patch JSON write folder (append_to_mock_data uses BASE_DIR/db/json_data)
    monkeypatch.setattr(services_modules, "BASE_DIR", tmp_path)

    # Also ensure tmp_path/db/json_data exists so append_to_mock_data can write
    (tmp_path / "db" / "json_data").mkdir(parents=True, exist_ok=True)

    return tmp_path


# Helper to generate uploadable test files for the endpoint.
def make_upload_files(tmp_path: Path):
    config_data: dict[str, Any] = {
        "executable": "test_exec",
        "parameters": [],
        "input_formats": [],
        "output_formats": [],
    }
    config_bytes = json.dumps(config_data).encode("utf-8")

    return {
        "config": ("config.json", io.BytesIO(config_bytes), "application/json"),
        "darwin_exec": (
            "darwin_exec",
            io.BytesIO(b"binary"),
            "application/octet-stream",
        ),
        "darwin_lib": ("darwin_lib", io.BytesIO(b"binary"), "application/octet-stream"),
        "linux_exec": ("linux_exec", io.BytesIO(b"binary"), "application/octet-stream"),
        "linux_lib": ("linux_lib", io.BytesIO(b"binary"), "application/octet-stream"),
        "windows_exec": (
            "windows_exec",
            io.BytesIO(b"binary"),
            "application/octet-stream",
        ),
        "windows_lib": (
            "windows_lib",
            io.BytesIO(b"binary"),
            "application/octet-stream",
        ),
    }


# Test /modules endpoint returns all mock modules correctly
def test_get_modules_success(patched_dirs: Path, client: TestClient):
    # Arrange
    json_data: dict[str, list[dict[str, Any]]] = {
        "data": [
            {
                "name": "video_source",
                "type": "inputNode",
                "parameters": [
                    {
                        "name": "path",
                        "flag": "-i",
                        "type": "str",
                        "default": "test.mp4",
                        "required": True,
                        "description": "Input file path",
                    }
                ],
                "input_formats": [],
                "output_formats": [],
            }
        ]
    }

    # Write fake JSON to temp folder
    test_file = patched_dirs / "test.json"
    test_file.write_text(json.dumps(json_data))

    # Act
    response = client.get("/api/modules/")

    # Assert
    assert response.status_code == 200
    modules: list[dict[str, Any]] = response.json()
    assert isinstance(modules, list)
    assert len(modules) == 1
    assert modules[0]["data"]["name"] == "Video Source"
    assert modules[0]["type"] == "inputNode"


# Test /modules endpoint handles invalid JSON gracefully.
def test_get_modules_invalid_json(patched_dirs: Path, client: TestClient):
    # Arrange
    # Write invalid JSON to the tmp folder
    broken_file = patched_dirs / "broken.json"
    broken_file.write_text("{ invalid json }")

    # Act
    response = client.get("/api/modules/")

    # Assert
    assert response.status_code == 400
    assert "error" in response.text.lower() or "invalid" in response.text.lower()


# Test successful module upload creates correct folder structure
def test_upload_module_success(patched_dirs: Path, client: TestClient):
    # Arrange
    files = make_upload_files(patched_dirs)

    # Act
    response = client.post("/api/modules/upload", files=files)

    # Assert
    assert response.status_code == 200
    assert response.json() is True
    module_dir = patched_dirs / "test_exec"
    assert (module_dir / "Linux-x86_64").exists()
    assert (module_dir / "Windows-AMD64").exists()


# Test duplicate module upload fails with 500 error
def test_upload_module_duplicate(patched_dirs: Path, client: TestClient):
    # Arrange
    files = make_upload_files(patched_dirs)

    # First upload should succeed
    client.post("/api/modules/upload", files=files)

    # Act
    # Second upload with same config should fail
    response = client.post("/api/modules/upload", files=files)

    # Assert
    assert response.status_code == 500
    assert "already exists" in response.text


# Test invalid module upload fails with 500 error
def test_upload_module_invalid_json(patched_dirs: Path, client: TestClient):
    # Arrange
    bad_config = ("config.json", io.BytesIO(b"{ not valid json }"), "application/json")

    files: dict[str, tuple[str, Any, str]] = {
        "config": bad_config,
        "darwin_exec": ("darwin_exec", io.BytesIO(b"bin"), "application/octet-stream"),
        "darwin_lib": ("darwin_lib", io.BytesIO(b"bin"), "application/octet-stream"),
        "linux_exec": ("linux_exec", io.BytesIO(b"bin"), "application/octet-stream"),
        "linux_lib": ("linux_lib", io.BytesIO(b"bin"), "application/octet-stream"),
        "windows_exec": (
            "windows_exec",
            io.BytesIO(b"bin"),
            "application/octet-stream",
        ),
        "windows_lib": ("windows_lib", io.BytesIO(b"bin"), "application/octet-stream"),
    }

    # Act
    response = client.post("/api/modules/upload", files=files)

    # Assert
    assert response.status_code == 500
    assert "expecting property name" in response.text.lower()
