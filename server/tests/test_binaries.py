import json
from typing import Any
from unittest.mock import patch, MagicMock, mock_open
import zipfile
from app.services.binaries import download_gist_files, OUTPUT_DIR
import pytest


# Simulates GitHub Gist JSON
def gist_response():
    return {
        "files": {
            "dummy.zip": {"raw_url": "https://gist.githubusercontent.com/dummy.zip"}
        }
    }


BINARY_IDS: list[str] = [
    "9f3f1d50d2a57344fca7845ca2225b09"  # simple-video-processor-app
]


# Simulates a complete successful flow of downloading and extracting binaries
@patch("app.services.binaries.zipfile.is_zipfile", return_value=True)
@patch("builtins.open", new_callable=mock_open)
@patch("app.services.binaries.zipfile.ZipFile")
@patch("app.services.binaries.urllib.request.urlopen")
def test_download_gist_files_success(
    mock_urlopen: MagicMock,
    mock_zipfile: MagicMock,
    mock_file_open: MagicMock,
    mock_is_zipfile: MagicMock,
) -> None:
    # First call to urlopen returns gist metadata
    metadata_response = MagicMock()
    metadata_response.read.return_value = json.dumps(gist_response()).encode("utf-8")
    metadata_response.__enter__.return_value = metadata_response

    # Second call returns zip file bytes
    zip_response = MagicMock()
    zip_response.read.return_value = b"zip-bytes"
    zip_response.__enter__.return_value = zip_response

    # Patch side effects
    mock_urlopen.side_effect = [metadata_response, zip_response]

    # Mock zip context manager
    mock_zip_context = MagicMock()
    mock_zipfile.return_value.__enter__.return_value = mock_zip_context

    # Run the function
    result_path = download_gist_files(BINARY_IDS)

    # Assertions
    assert result_path == OUTPUT_DIR
    assert mock_urlopen.call_count == 2
    assert mock_zipfile.called


# Tests failure to fetch gist metadata due to network error
@patch("app.services.binaries.urllib.request.urlopen")
def test_download_gist_metadata_failure(mock_urlopen: MagicMock) -> None:
    # Simulate network error when trying to fetch gist metadata
    mock_urlopen.side_effect = Exception("network error")

    # Expect an exception to be raised
    with pytest.raises(Exception, match="Failed to fetch Gist data"):
        download_gist_files(BINARY_IDS)


# Tests that an empty "files" object in gist raises exception
@patch("app.services.binaries.urllib.request.urlopen")
def test_download_gist_files_empty_files(mock_urlopen: MagicMock) -> None:
    # Simulate a successful metadata fetch with an empty "files" dictionary
    metadata_response = MagicMock()
    metadata_response.read.return_value = json.dumps({"files": {}}).encode("utf-8")
    metadata_response.__enter__.return_value = metadata_response

    # Mock urlopen to return the metadata response
    mock_urlopen.return_value = metadata_response

    # Expect an exception to be raised
    with pytest.raises(Exception, match="No files found in the Gist"):
        download_gist_files(BINARY_IDS)


# Tests that file download failure is caught and skipped without crashing
@patch("app.services.binaries.urllib.request.urlopen")
def test_file_download_error(mock_urlopen: MagicMock) -> None:
    # Simulate metadata fetch with a valid file entry
    metadata_response = MagicMock()
    metadata_response.read.return_value = json.dumps(gist_response()).encode("utf-8")
    metadata_response.__enter__.return_value = metadata_response

    # Second call raises download error
    def urlopen_side_effect(
        *args: tuple[Any, ...], **kwargs: dict[str, Any]
    ) -> MagicMock:
        if "api.github.com" in args[0]:
            return metadata_response
        else:
            raise Exception("file download failed")

    mock_urlopen.side_effect = urlopen_side_effect

    # Should not raise, because the file download exception is caught and continued
    download_gist_files(BINARY_IDS)


# Tests that non-zip files are safely skipped during processing
@patch("app.services.binaries.zipfile.is_zipfile", return_value=False)
@patch("builtins.open", new_callable=mock_open)
@patch("app.services.binaries.urllib.request.urlopen")
def test_non_zip_file_skipped(
    mock_urlopen: MagicMock,
    mock_file_open: MagicMock,
    mock_is_zipfile: MagicMock,
) -> None:
    # Simulate metadata fetch with a valid file entry
    metadata_response = MagicMock()
    metadata_response.read.return_value = json.dumps(gist_response()).encode("utf-8")
    metadata_response.__enter__.return_value = metadata_response

    # Simulate file download response with non-zip content
    file_response = MagicMock()
    file_response.read.return_value = b"not-a-zip"
    file_response.__enter__.return_value = file_response

    # Set side effects: first call returns metadata, second returns non-zip file
    mock_urlopen.side_effect = [metadata_response, file_response]

    # Run and verify that non-zip file is skipped without raising an exception
    download_gist_files(BINARY_IDS)


# Tests that a corrupt zip file raises exception
@patch("app.services.binaries.zipfile.ZipFile", side_effect=zipfile.BadZipFile())
@patch("app.services.binaries.zipfile.is_zipfile", return_value=True)
@patch("builtins.open", new_callable=mock_open)
@patch("app.services.binaries.urllib.request.urlopen")
def test_bad_zip_file(
    mock_urlopen: MagicMock,
    mock_file_open: MagicMock,
    mock_is_zipfile: MagicMock,
    mock_zipfile: MagicMock,
) -> None:
    # Simulate metadata response with valid file entry
    metadata_response = MagicMock()
    metadata_response.read.return_value = json.dumps(gist_response()).encode("utf-8")
    metadata_response.__enter__.return_value = metadata_response

    # Simulate corrupt zip file content
    zip_response = MagicMock()
    zip_response.read.return_value = b"corrupt-zip"
    zip_response.__enter__.return_value = zip_response

    # Set side effects: first call returns metadata, second returns non-zip file
    mock_urlopen.side_effect = [metadata_response, zip_response]

    # Verify that BadZipFile raises an exception
    with pytest.raises(Exception, match="not a valid zip file"):
        download_gist_files(BINARY_IDS)
