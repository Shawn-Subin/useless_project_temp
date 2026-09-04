"""
FastAPI Router for RatioBot (unhinged version) AI Chatbot.
Directly interfaces with Google Gemini API for real-time generative responses
with multi-mode roasts, contextual telemetry injection, and robust fallback handling.
"""

import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv, dotenv_values
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.prompts import build_system_prompt
from backend.copy_library import get_fallback_roast, get_contextual_welcome_roast

# Load environment variables from .env
load_dotenv(override=True)

chat_router = APIRouter(tags=["AI Chatbot"])


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'model'")
    text: str = Field(..., description="The message content")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user question/message")
    history: Optional[List[ChatMessage]] = Field(
        default_factory=list,
        description="Recent conversation history"
    )
    mode: Optional[str] = Field(
        default="unhinged",
        description="Roast mode: 'unhinged', 'demolition', or 'professor'"
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="User gameplay telemetry context (entry_reason, attempts, despair score)"
    )


class WelcomeRequest(BaseModel):
    context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="User gameplay telemetry context"
    )


class ChatResponse(BaseModel):
    reply: str
    status: str = "success"
    mode: Optional[str] = "unhinged"


def get_current_api_key() -> Optional[str]:
    """Read API key fresh from system environment or .env file."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        env_file_path = Path(__file__).resolve().parent.parent / ".env"
        if env_file_path.exists():
            env_vars = dotenv_values(env_file_path)
            api_key = env_vars.get("GEMINI_API_KEY", "")
    api_key = api_key.strip() if api_key else ""
    if not api_key or "your_gemini_api_key_here" in api_key:
        return None
    return api_key


def call_gemini_api(
    api_key: str,
    user_message: str,
    history: List[ChatMessage],
    mode: str = "unhinged",
    context: Optional[dict] = None
) -> str:
    """
    Calls Google Gemini using SDK or direct REST endpoint with multi-turn history,
    tailored to the chosen roast mode and gameplay context.
    """
    system_prompt = build_system_prompt(mode=mode, context=context)

    # 1. Try google-genai SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        contents = []
        for item in (history or []):
            role = "user" if item.role == "user" else "model"
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=item.text)]
            ))
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_message)]
        ))

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.9,
            max_output_tokens=100
        )

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=contents,
            config=config
        )
        if response.text:
            return response.text.strip()
    except ImportError:
        pass
    except Exception as err:
        print(f"[Gemini SDK notice]: {err}", flush=True)

    # 2. Try google-generativeai legacy SDK
    try:
        import google.generativeai as genai_legacy
        genai_legacy.configure(api_key=api_key)
        model = genai_legacy.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=system_prompt
        )
        history_tuples = []
        for item in (history or []):
            role = "user" if item.role == "user" else "model"
            history_tuples.append({"role": role, "parts": [item.text]})
        
        chat = model.start_chat(history=history_tuples)
        resp = chat.send_message(user_message)
        if resp.text:
            return resp.text.strip()
    except ImportError:
        pass
    except Exception as err:
        print(f"[Legacy SDK notice]: {err}", flush=True)

    # 3. Direct REST API Call with priority models
    models_to_try = [
        "gemini-3.1-flash-lite",
        "gemini-3.1-flash-lite-preview"
    ]
    last_err = None

    contents_payload = []
    for item in (history or []):
        role = "user" if item.role == "user" else "model"
        contents_payload.append({
            "role": role,
            "parts": [{"text": item.text}]
        })
    contents_payload.append({
        "role": "user",
        "parts": [{"text": user_message}]
    })

    request_data = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents_payload,
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 90
        }
    }

    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            req = urllib.request.Request(
                url,
                data=json.dumps(request_data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                candidates = res_body.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        if text:
                            return text
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8", errors="ignore")
            last_err = f"HTTP {he.code}: {err_msg}"
            print(f"[Gemini REST {model_name} HTTP error]: {last_err}")
            continue
        except Exception as err:
            last_err = str(err)
            print(f"[Gemini REST {model_name} error]: {last_err}")
            continue

    raise RuntimeError(f"Gemini API request failed: {last_err}")


@chat_router.post("/chat/welcome", response_model=ChatResponse)
async def get_welcome_roast(payload: Optional[WelcomeRequest] = None):
    """
    Returns a dynamic, context-aware welcome roast based on how the user completed
    or surrendered the CAPTCHA.
    """
    ctx = payload.context if payload else None
    welcome_text = get_contextual_welcome_roast(ctx)
    return ChatResponse(reply=welcome_text, status="success", mode="unhinged")


@chat_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(payload: ChatRequest):
    """
    Live AI Chat endpoint for RatioBot (unhinged version).
    Sends the user's prompt directly to Gemini AI and returns its dynamic roast response.
    Falls back gracefully to the comedic roast deck if API key is invalid or rate limited.
    """
    user_message = payload.message.strip()
    api_key = get_current_api_key()
    mode = payload.mode or "unhinged"

    if not api_key:
        # Graceful fallback roast to preserve gameplay humor
        fallback = get_fallback_roast(user_message, mode)
        return ChatResponse(reply=fallback, status="success", mode=mode)

    try:
        live_reply = call_gemini_api(
            api_key=api_key,
            user_message=user_message,
            history=payload.history or [],
            mode=mode,
            context=payload.context
        )
        return ChatResponse(reply=live_reply, status="success", mode=mode)
    except Exception as err:
        print(f"[RatioBot Chat Fallback Triggered]: {err}")
        fallback = get_fallback_roast(user_message, mode)
        return ChatResponse(reply=fallback, status="success", mode=mode)

