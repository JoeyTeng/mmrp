from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from main import app
from app.services import pipeline
from _pytest.monkeypatch import MonkeyPatch


# Auto-used fixture to patch gist download function
@pytest.fixture(autouse=True)
def mock_download(monkeypatch: MonkeyPatch):
    from app.services import binaries

    monkeypatch.setattr(binaries, "download_gist_files", lambda: Path("."))


# FastAPI TestClient fixture
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# Test /pipeline/examples endpoint returns example pipelines successfully
def test_get_examples_success(monkeypatch: MonkeyPatch, client: TestClient):
    # Arrange
    mock_examples = [
        pipeline.ExamplePipeline(
            id="example1", name="Test Pipeline", nodes=[], edges=[]
        )
    ]

    # Patch where the router actually uses it
    monkeypatch.setattr("app.routers.pipeline.list_examples", lambda: mock_examples)

    # Act
    response = client.get("/api/pipeline/examples/")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == "example1"
    assert data[0]["name"] == "Test Pipeline"


# Test /pipeline/examples endpoint handles errors gracefully
def test_get_examples_failure(monkeypatch: MonkeyPatch, client: TestClient):
    # Arrange: make list_examples raise an exception
    def mock_list_examples():
        raise RuntimeError("Simulated failure")

    # Patch the function where the router actually uses it
    monkeypatch.setattr("app.routers.pipeline.list_examples", mock_list_examples)

    # Act
    response = client.get("/api/pipeline/examples/")

    # Assert
    assert response.status_code == 500
    data = response.json()
    assert "Unexpected error" in data["detail"]
