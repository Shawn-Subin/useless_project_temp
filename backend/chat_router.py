"""
FastAPI Router for RatioBot (unhinged version) AI Chatbot.
Directly interfaces with Google Gemini API for real-time generative responses.
All canned/static responses have been removed.
"""

import os
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv, dotenv_values
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.prompts import SYSTEM_PROMPT

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


class ChatResponse(BaseModel):
    reply: str
    status: str = "success"


def get_current_api_key() -> Optional[str]:
    """Read API key fresh from .env file or system environment."""
    env_file_path = Path(__file__).resolve().parent.parent / ".env"
    env_vars = dotenv_values(env_file_path) if env_file_path.exists() else {}
    api_key = env_vars.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY", "")
    api_key = api_key.strip() if api_key else ""
    if not api_key or "your_gemini_api_key_here" in api_key:
        return None
    return api_key


def call_gemini_api(api_key: str, user_message: str, history: List[ChatMessage]) -> str:
    """
    Calls Google Gemini using SDK or direct REST endpoint with multi-turn history.
    """
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
            system_instruction=SYSTEM_PROMPT,
            temperature=1.0,
            max_output_tokens=150
        )

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=contents,
            config=config
        )
        if response.text:
            return response.text.strip()
    except ImportError:
        pass
    except Exception as err:
        print(f"[Gemini SDK notice]: {err}")

    # 2. Try google-generativeai legacy SDK
    try:
        import google.generativeai as genai_legacy
        genai_legacy.configure(api_key=api_key)
        model = genai_legacy.GenerativeModel(
            model_name="gemini-3.6-flash",
            system_instruction=SYSTEM_PROMPT
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
        print(f"[Legacy SDK notice]: {err}")

    # 3. Direct REST API Call with auto-discovery of enabled models
    try:
        list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        list_req = urllib.request.Request(list_url)
        with urllib.request.urlopen(list_req, timeout=8) as list_resp:
            list_data = json.loads(list_resp.read().decode("utf-8"))
            available = [
                m["name"].replace("models/", "")
                for m in list_data.get("models", [])
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]
    except Exception:
        available = []

    preferred_models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.0-pro"
    ]

    models_to_try = [m for m in preferred_models if m in available] or available or ["gemini-1.5-flash"]
    last_err = None

    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            
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
                    "parts": [{"text": SYSTEM_PROMPT}]
                },
                "contents": contents_payload,
                "generationConfig": {
                    "temperature": 1.0,
                    "maxOutputTokens": 150
                }
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(request_data).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                candidates = res_body.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode('utf-8', errors='ignore')
            last_err = f"HTTP {he.code}: {err_msg}"
            print(f"[Gemini REST {model_name} HTTP error]: {last_err}")
        except Exception as err:
            last_err = str(err)
            print(f"[Gemini REST {model_name} error]: {last_err}")

    raise RuntimeError(f"Gemini API request failed: {last_err}")


@chat_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(payload: ChatRequest):
    """
    Live AI Chat endpoint for RatioBot (unhinged version).
    Sends the user's prompt directly to Gemini AI and returns its dynamic roast response.
    """
    user_message = payload.message.strip()
    api_key = get_current_api_key()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GEMINI_API_KEY is not configured in .env. Please set your key to enable live AI responses."
        )

    try:
        live_reply = call_gemini_api(api_key, user_message, payload.history or [])
        return ChatResponse(reply=live_reply, status="success")
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error contacting Gemini AI: {err}"
        )
