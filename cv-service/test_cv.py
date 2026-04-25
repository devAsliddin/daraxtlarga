"""
Yashil Quest CV Service - Tests
Run with: pytest test_cv.py -v
"""
import pytest
import base64
import json
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))


def create_green_image_b64() -> str:
    """Create a simple green image for testing"""
    try:
        from PIL import Image
        import io
        img = Image.new("RGB", (224, 224), color=(30, 120, 30))  # Green
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode()
    except ImportError:
        # Return a minimal valid JPEG base64
        return "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_endpoint(client):
    """Test CV service health check"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "models" in data
    assert "available_libraries" in data


def test_analyze_empty_photos(client):
    """Test that empty photos list returns 400"""
    response = client.post("/analyze", json={"photos": []})
    assert response.status_code == 400


def test_analyze_with_single_photo(client):
    """Test analysis with a single green image"""
    photo_b64 = create_green_image_b64()
    response = client.post("/analyze", json={
        "photos": [photo_b64],
        "tree_id": "test-tree-123"
    })
    assert response.status_code == 200
    data = response.json()

    # Verify all required fields are present
    assert "treeCount" in data
    assert "healthScore" in data
    assert "ndvi" in data
    assert "detections" in data
    assert "healthLabel" in data
    assert "ndviCategory" in data
    assert "processingTime" in data
    assert "modelsUsed" in data

    # Verify value ranges
    assert data["treeCount"] >= 0
    assert 0 <= data["healthScore"] <= 100
    assert -1.0 <= data["ndvi"] <= 1.0
    assert isinstance(data["detections"], list)


def test_analyze_health_label_categories(client):
    """Test that health labels are valid"""
    photo_b64 = create_green_image_b64()
    response = client.post("/analyze", json={"photos": [photo_b64]})
    assert response.status_code == 200
    data = response.json()

    valid_labels = {"healthy", "moderate", "stressed"}
    assert data["healthLabel"] in valid_labels


def test_analyze_ndvi_categories(client):
    """Test NDVI category assignment"""
    photo_b64 = create_green_image_b64()
    response = client.post("/analyze", json={"photos": [photo_b64]})
    data = response.json()

    valid_categories = {"lush", "moderate", "sparse", "barren"}
    assert data["ndviCategory"] in valid_categories


def test_analyze_multiple_photos(client):
    """Test analysis with multiple photos (max 3)"""
    photo_b64 = create_green_image_b64()
    response = client.post("/analyze", json={
        "photos": [photo_b64, photo_b64, photo_b64],
        "tree_id": "multi-photo-test"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["treeCount"] >= 0


def test_analyze_processing_time(client):
    """Test that processing time is reasonable"""
    photo_b64 = create_green_image_b64()
    response = client.post("/analyze", json={"photos": [photo_b64]})
    data = response.json()
    assert data["processingTime"] >= 0
    assert data["processingTime"] < 60  # Should not take more than 60 seconds


def test_detect_duplicates_endpoint(client):
    """Test duplicate detection endpoint"""
    photo_b64 = create_green_image_b64()
    response = client.post(
        "/detect-duplicates",
        json=[photo_b64, photo_b64]  # Same image twice
    )
    assert response.status_code == 200
    data = response.json()
    assert "duplicates" in data
    assert "similarity" in data


def test_analyze_invalid_base64(client):
    """Test handling of invalid base64 input"""
    response = client.post("/analyze", json={
        "photos": ["not-valid-base64!!!"],
        "tree_id": "error-test"
    })
    # Should either return 200 with fallback or handle gracefully
    assert response.status_code in [200, 400, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
