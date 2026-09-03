"""
In-memory session manager for Escalating Captcha.
Tracks session state, current level, expected answer, despair metrics, and timestamps.
"""

import time
import uuid
from typing import Dict, Optional, Any
from pydantic import BaseModel


class SessionState(BaseModel):
    session_id: str
    current_level: int = 1
    expected_answer: Optional[str] = None
    level_attempts: int = 0
    total_attempts: int = 0
    failed_attempts: int = 0
    despair_score: int = 0
    created_at: float
    last_active: float
    completed: bool = False
    metadata: Dict[str, Any] = {}


class SessionManager:
    def __init__(self, session_ttl_seconds: int = 3600):
        self._sessions: Dict[str, SessionState] = {}
        self.session_ttl = session_ttl_seconds

    def _cleanup_expired(self):
        now = time.time()
        expired_keys = [
            sid for sid, sess in self._sessions.items()
            if (now - sess.last_active) > self.session_ttl
        ]
        for sid in expired_keys:
            self._sessions.pop(sid, None)

    def get_or_create_session(self, session_id: Optional[str] = None, target_level: Optional[int] = None) -> SessionState:
        self._cleanup_expired()
        now = time.time()

        if session_id and session_id in self._sessions:
            sess = self._sessions[session_id]
            sess.last_active = now
            if target_level is not None and 1 <= target_level <= 10:
                sess.current_level = target_level
                sess.level_attempts = 0
            return sess

        new_id = session_id if (session_id and len(session_id) > 4) else str(uuid.uuid4())
        level = target_level if (target_level and 1 <= target_level <= 10) else 1
        sess = SessionState(
            session_id=new_id,
            current_level=level,
            created_at=now,
            last_active=now,
            despair_score=0
        )
        self._sessions[new_id] = sess
        return sess

    def set_expected_answer(self, session_id: str, answer: Optional[str], metadata: Optional[Dict[str, Any]] = None):
        if session_id in self._sessions:
            self._sessions[session_id].expected_answer = answer
            self._sessions[session_id].last_active = time.time()
            if metadata:
                self._sessions[session_id].metadata = metadata

    def record_attempt(self, session_id: str, is_correct: bool) -> SessionState:
        sess = self._sessions.get(session_id)
        if not sess:
            sess = self.get_or_create_session(session_id)

        sess.total_attempts += 1
        sess.level_attempts += 1
        sess.last_active = time.time()

        if is_correct:
            # Reward reduces despair slightly or keeps it steady
            sess.despair_score = max(0, sess.despair_score - 5)
        else:
            sess.failed_attempts += 1
            # Escalating despair based on level and failed attempts
            despair_boost = 15 + (sess.current_level * 5) + (sess.level_attempts * 3)
            sess.despair_score = min(100, sess.despair_score + despair_boost)

        return sess

    def advance_level(self, session_id: str) -> SessionState:
        sess = self._sessions.get(session_id)
        if not sess:
            sess = self.get_or_create_session(session_id)

        sess.current_level += 1
        sess.level_attempts = 0
        sess.expected_answer = None
        sess.last_active = time.time()
        return sess

    def reset_session(self, session_id: str) -> SessionState:
        if session_id in self._sessions:
            del self._sessions[session_id]
        return self.get_or_create_session(session_id=session_id, target_level=1)


# Global singleton instance for easy import across router and engine
session_store = SessionManager()
