"""
Unit tests for Escalating Captcha backend API and engine (3 Stages).
1. Step 1: Normal reCAPTCHA
2. Step 2: Interactive Rigged Tic-Tac-Toe
3. Step 3: Impossible Final Security Challenge
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.session_manager import session_store
from backend.captcha_engine import CaptchaEngine

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/captcha/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["max_stages"] == 3


def test_new_captcha_level_1():
    response = client.get("/captcha/new?level=1")
    assert response.status_code == 200
    data = response.json()
    assert data["level"] == 1
    assert "data:image" in data["image_data_uri"]
    assert data["session_id"] is not None


def test_level_1_correct_verification_flow():
    # 1. Fetch challenge
    res = client.get("/captcha/new?level=1")
    data = res.json()
    sid = data["session_id"]

    # Retrieve expected answer stored securely in memory
    sess = session_store.get_or_create_session(sid)
    expected = sess.expected_answer
    assert expected is not None

    # 2. Verify with correct answer
    verify_res = client.post("/captcha/verify", json={
        "session_id": sid,
        "answer": expected
    })
    assert verify_res.status_code == 200
    vdata = verify_res.json()
    assert vdata["correct"] is True
    assert vdata["next_level"] == 2
    assert vdata["current_level"] == 1


def test_level_2_minigame_metadata():
    """Level 2 must return minigame flag for Tic-Tac-Toe."""
    res = client.get("/captcha/new?level=2")
    assert res.status_code == 200
    data = res.json()
    assert data["level"] == 2
    assert data["is_minigame"] is True
    assert data["minigame_type"] == "tictactoe"
    assert data["level_badge"] == "STEP 2 OF 3"


def test_level_3_guaranteed_fail():
    """Level 3+ must reject every input unconditionally for comedic effect."""
    res = client.get("/captcha/new?level=3")
    assert res.status_code == 200
    data = res.json()
    sid = data["session_id"]

    for test_input in ["anything", "correct", "ඞ", "12345", ""]:
        v_res = client.post("/captcha/verify", json={
            "session_id": sid,
            "answer": test_input
        })
        assert v_res.status_code == 200
        vdata = v_res.json()
        assert vdata["correct"] is False
        assert vdata["is_terminal_level"] is True
        assert vdata["current_level"] == 3


def test_reset_session():
    res = client.get("/captcha/new?level=2")
    sid = res.json()["session_id"]

    reset_res = client.post("/captcha/reset", json={"session_id": sid})
    assert reset_res.status_code == 200
    data = reset_res.json()
    assert data["current_level"] == 1
