import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from _pytest.monkeypatch import MonkeyPatch
from main import app
from app.schemas.video import VideoRequest
from app.utils import shared_functionality


VIDEO_NAME = "test_video.mp4"
VIDEO_BYTES = b"fake_video_content"


# FastAPI TestClient fixture
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# Fixture that creates a temporary fake video file
@pytest.fixture
def temp_video_file(tmp_path: Path) -> Path:
    file_path = tmp_path / VIDEO_NAME
    file_path.write_bytes(VIDEO_BYTES)
    return file_path


# Auto-used fixture that patches get_video_path to return the fake video
@pytest.fixture(autouse=True)
def mock_get_video_path(monkeypatch: MonkeyPatch, temp_video_file: Path):
    def fake_get_video_path(_: str) -> Path:
        return temp_video_file

    monkeypatch.setattr(shared_functionality, "get_video_path", fake_get_video_path)


# Test /video endpoint rejects unsupported formats
def test_get_video_unsupported_format(client: TestClient):
    # Arrange
    request_payload = VideoRequest(video_name="bad_file.txt", output=False).model_dump()

    # Act
    response = client.post("/api/video/", json=request_payload)

    # Assert
    assert response.status_code == 400
    data: dict[str, str] = response.json()
    assert "Unsupported format" in data["detail"]


# Test /video endpoint returns 404 when file does not exist
def test_get_video_not_found(client: TestClient, monkeypatch: MonkeyPatch):
    # Arrange
    # Patch get_video_path to return a non-existent file
    def fake_missing_video(_: str) -> Path:
        return Path("/non/existent/file.mp4")

    monkeypatch.setattr(shared_functionality, "get_video_path", fake_missing_video)
    request_payload = VideoRequest(video_name=VIDEO_NAME, output=False).model_dump()

    # Act
    response = client.post("/api/video/", json=request_payload)

    # Assert
    assert response.status_code == 404
    assert "Video not found" in response.json()["detail"]
