"""
Unit tests for RatioBot AI Chatbot endpoint (/api/chat).
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_chat_endpoint_valid():
    """Verify chatbot returns a valid roast reply."""
    response = client.post("/api/chat", json={
        "message": "Why is water wet?"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0


def test_chat_endpoint_with_history():
    """Verify chatbot accepts conversation history."""
    response = client.post("/api/chat", json={
        "message": "Are you still there?",
        "history": [
            {"role": "user", "text": "Hello"},
            {"role": "model", "text": "Unfortunately yes, I am still here."}
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["reply"], str)
    assert len(data["reply"]) > 0


def test_chat_endpoint_empty_message():
    """Verify empty message triggers validation error."""
    response = client.post("/api/chat", json={
        "message": ""
    })
    assert response.status_code == 422
