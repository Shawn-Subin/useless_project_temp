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


def test_chat_endpoint_modes_and_context():
    """Verify chatbot supports roast modes and gameplay context."""
    for mode in ["unhinged", "demolition", "professor"]:
        response = client.post("/api/chat", json={
            "message": "Why did the verify button run away?",
            "mode": mode,
            "context": {
                "entry_reason": "bot_surrender",
                "attempts": 8,
                "despair": 75
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["mode"] == mode
        assert len(data["reply"]) > 0


def test_welcome_roast_endpoint():
    """Verify /api/chat/welcome returns contextual opening roast."""
    # Bot surrender welcome
    resp_bot = client.post("/api/chat/welcome", json={
        "context": {"entry_reason": "bot_surrender"}
    })
    assert resp_bot.status_code == 200
    assert "bot" in resp_bot.json()["reply"].lower() or "toaster" in resp_bot.json()["reply"].lower() or "appliance" in resp_bot.json()["reply"].lower()

    # Tab nerd welcome
    resp_tab = client.post("/api/chat/welcome", json={
        "context": {"entry_reason": "tab_nerd"}
    })
    assert resp_tab.status_code == 200
    assert "nerd" in resp_tab.json()["reply"].lower() or "tab" in resp_tab.json()["reply"].lower() or "keyboard" in resp_tab.json()["reply"].lower()


def test_chat_endpoint_empty_message():
    """Verify empty message triggers validation error."""
    response = client.post("/api/chat", json={
        "message": ""
    })
    assert response.status_code == 422

