"""
Main FastAPI entry point for Escalating Captcha + Absurd Answers AI Chatbot.
Serves static frontend and mounts the /captcha and /api chat routers.
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.captcha_router import captcha_router
from backend.chat_router import chat_router

app = FastAPI(
    title="Escalating Captcha & Absurd Answers AI",
    description="A satirical reCAPTCHA gatekeeper integrated with an unhinged AI Chatbot.",
    version="2.0.0"
)

# Enable CORS for flexible integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(captcha_router, prefix="/captcha")
app.include_router(chat_router, prefix="/api")

# Setup Static Files Directory
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    @app.get("/", response_class=FileResponse)
    async def serve_index():
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Static frontend not found. Visit /docs for API."}
else:
    @app.get("/")
    async def root():
        return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
