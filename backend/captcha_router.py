"""
FastAPI Router for Escalating Captcha (3 Stages).
1. Step 1: Normal reCAPTCHA
2. Step 2: Interactive Rigged Tic-Tac-Toe
3. Step 3: Easy-to-read text with running/evasive Verify button & 'I am a bot' surrender option
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.session_manager import session_store
from backend.captcha_engine import CaptchaEngine
from backend.copy_library import (
    get_level_metadata,
    get_random_success_message,
    get_random_wrong_taunt
)

# Router definition
captcha_router = APIRouter(tags=["Escalating Captcha"])


# Request / Response Schemas
class VerifyRequest(BaseModel):
    session_id: str = Field(..., description="Unique user session token")
    answer: str = Field(..., description="User submitted captcha response")


class ResetRequest(BaseModel):
    session_id: str = Field(..., description="Unique user session token to reset")


class CaptchaChallengeResponse(BaseModel):
    session_id: str
    level: int
    level_title: str
    level_desc: str
    difficulty: str
    level_badge: str
    image_data_uri: str
    prompt_hint: str
    audio_script: str
    evasive_mode: bool
    shake_mode: bool
    scramble_mode: bool = False
    is_minigame: bool = False
    minigame_type: Optional[str] = None
    initial_taunt: str
    despair_score: int
    attempts_at_level: int
    total_attempts: int


class VerifyResponse(BaseModel):
    correct: bool
    current_level: int
    next_level: int
    message: str
    despair_score: int
    game_over: bool
    is_terminal_level: bool
    session_id: str


@captcha_router.get("/new", response_model=CaptchaChallengeResponse)
async def get_new_captcha(
    session_id: Optional[str] = Query(None, description="Optional existing session ID"),
    level: Optional[int] = Query(None, ge=1, le=3, description="Target difficulty level (1-3)")
):
    """
    Generate a new CAPTCHA challenge for the current or requested session level.
    """
    sess = session_store.get_or_create_session(session_id=session_id, target_level=level)
    curr_lvl = sess.current_level
    lvl_meta = get_level_metadata(curr_lvl)

    # Generate challenge
    image_uri, expected_answer, extra_meta = CaptchaEngine.generate(curr_lvl)

    session_store.set_expected_answer(
        session_id=sess.session_id,
        answer=expected_answer,
        metadata=extra_meta
    )

    return CaptchaChallengeResponse(
        session_id=sess.session_id,
        level=curr_lvl,
        level_title=lvl_meta["title"],
        level_desc=lvl_meta["description"],
        difficulty=lvl_meta["difficulty"],
        level_badge=extra_meta.get("level_badge", lvl_meta["badge"]),
        image_data_uri=image_uri,
        prompt_hint=extra_meta.get("prompt_hint", "Solve the challenge"),
        audio_script=extra_meta.get("audio_script", "Solve the displayed captcha."),
        evasive_mode=extra_meta.get("evasive_mode", lvl_meta["evasive_mode"]),
        shake_mode=extra_meta.get("shake_mode", lvl_meta["shake_mode"]),
        scramble_mode=extra_meta.get("scramble_mode", lvl_meta.get("scramble_mode", False)),
        is_minigame=extra_meta.get("is_minigame", False),
        minigame_type=extra_meta.get("minigame_type", None),
        initial_taunt=lvl_meta["initial_taunt"],
        despair_score=sess.despair_score,
        attempts_at_level=sess.level_attempts,
        total_attempts=sess.total_attempts
    )


@captcha_router.post("/verify", response_model=VerifyResponse)
async def verify_captcha(payload: VerifyRequest):
    """
    Verify user submitted answer against the server-stored answer.
    Stage 1 & Stage 3 validate user input.
    Stage 2 (Tic-Tac-Toe) advances to Stage 3 upon completion.
    """
    session_id = payload.session_id
    user_input = payload.answer.strip()

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session ID is required."
        )

    sess = session_store.get_or_create_session(session_id=session_id)
    curr_lvl = sess.current_level
    expected = sess.expected_answer

    # STAGE 2: Tic-Tac-Toe Arbitrary Loss Advancement
    if curr_lvl == 2:
        sess = session_store.advance_level(session_id)
        return VerifyResponse(
            correct=True,
            current_level=curr_lvl,
            next_level=sess.current_level,
            message="Pattern verification registered. Proceeding to final check.",
            despair_score=sess.despair_score,
            game_over=False,
            is_terminal_level=False,
            session_id=sess.session_id
        )

    # STAGE 1 & STAGE 3: Check answer against expected
    is_correct = False
    if expected is not None and user_input.upper() == expected.upper():
        is_correct = True

    sess = session_store.record_attempt(session_id, is_correct=is_correct)

    if is_correct:
        success_msg = get_random_success_message()
        sess = session_store.advance_level(session_id)
        return VerifyResponse(
            correct=True,
            current_level=curr_lvl,
            next_level=sess.current_level,
            message=success_msg,
            despair_score=sess.despair_score,
            game_over=False,
            is_terminal_level=False,
            session_id=sess.session_id
        )
    else:
        taunt = get_random_wrong_taunt()
        return VerifyResponse(
            correct=False,
            current_level=curr_lvl,
            next_level=curr_lvl,
            message=taunt,
            despair_score=sess.despair_score,
            game_over=False,
            is_terminal_level=False,
            session_id=sess.session_id
        )


@captcha_router.post("/reset")
async def reset_session(payload: ResetRequest):
    """Reset session back to Level 1."""
    sess = session_store.reset_session(payload.session_id)
    return {
        "status": "reset",
        "session_id": sess.session_id,
        "current_level": sess.current_level,
        "message": "Challenge reset to Step 1."
    }


@captcha_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "operational",
        "service": "Escalating Captcha Subsystem",
        "version": "3.1.0",
        "max_stages": 3,
        "pillow_available": CaptchaEngine._get_font(20) is not None
    }
