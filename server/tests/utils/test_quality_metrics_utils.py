import numpy as np
import pytest

from app.utils import quality_metrics
from app.schemas.metrics import Metrics


# Test PSNR returns 100 for identical images
def test_psnr_identical_images_returns_100():
    # Arrange
    img = np.ones((8, 8, 3), dtype=np.uint8) * 128

    # Act
    value = quality_metrics.compute_psnr(img, img)

    # Assert
    assert value == pytest.approx(100.0)  # type: ignore


# Test SSIM returns 1 for identical images
def test_ssim_identical_images_is_one():
    # Arrange
    img = np.full((16, 16, 3), 200, dtype=np.uint8)

    # Act
    score = quality_metrics.compute_ssim(img, img)

    # Assert
    assert score == pytest.approx(1.0)  # type: ignore


# Test SSIM is less than 1 for different images
def test_ssim_different_images_less_than_one():
    # Arrange
    img1 = np.zeros((16, 16, 3), dtype=np.uint8)
    img2 = np.ones((16, 16, 3), dtype=np.uint8) * 255

    # Act
    score = quality_metrics.compute_ssim(img1, img2)

    # Assert
    assert 0 <= score < 1.0


# Test compute_metrics returns a Metrics object with correct types
def test_compute_metrics_returns_metrics_object():
    # Arrange
    img1 = np.zeros((16, 16, 3), dtype=np.uint8)
    img2 = np.ones((16, 16, 3), dtype=np.uint8) * 255

    # Act
    result = quality_metrics.compute_metrics(img1, img2)

    # Assert
    assert isinstance(result, Metrics)
    assert result.message is None
    assert isinstance(result.psnr, float)
    assert isinstance(result.ssim, float)
    assert result.psnr < 100
    assert result.ssim < 1.0


# Test PSNR handles float32 images correctly
def test_psnr_float_input_also_works():
    # Arrange
    img1 = np.zeros((4, 4, 3), dtype=np.float32)
    img2 = np.ones((4, 4, 3), dtype=np.float32) * 255

    # Act
    val = quality_metrics.compute_psnr(img1, img2)

    # Assert
    assert isinstance(val, (float, np.floating))
    assert val >= 0
