# Existence Verification Form 27-C — Federal Bureau of Robot Denial

A satirical mini-game where the user attempts to solve a CAPTCHA that gets progressively harder, weirder, and more evasive with each successful solve — ultimately becoming impossible on purpose for comedic effect.

> **Statutory Notice:** *Assessment difficulty may increase in response to successful completion.*

---

## Features & Escalating Levels

1. **Stage 1 — Routine Calibration**: Clean, crisp alphanumeric CAPTCHA with high contrast.
2. **Stage 2 — Optical Turbulence**: Rotated characters, sine-wave strike-through curves, and neural noise.
3. **Stage 3 — Chromatic Camouflage**: Text color almost identical to the background (barely distinguishable photons).
4. **Stage 4 — Kinetic Hyper-Scramble**: Sheared multi-axis sinusoidal text, decoy characters, and hyper-evasive dodging buttons.
5. **Stage 5 — Quantum Paradox**: Nonsensical mathematical paradoxes (e.g. `d/dx(banana) = ?`, `lim(x→∞)[Hope] = 0`), emoji glyphs, or mocking directives.
6. **Stage 6+ — The Turing Guillotine**: Eldritch void glyphs with **guaranteed server-side rejection (0% pass rate)**, escalating unhinged taunts, Despair Meter overload, and a downloadable **Form 27-C Rejection Notice**.

---

## Project Structure

```
.
├── backend/
│   ├── __init__.py
│   ├── main.py              # Main FastAPI application entry point
│   ├── captcha_router.py    # Modular APIRouter (mounted at /captcha)
│   ├── captcha_engine.py    # Pillow CAPTCHA rendering engine + SVG fallback
│   ├── session_manager.py   # In-memory session tracking & Despair metrics
│   └── copy_library.py      # Sarcastic taunts, level metadata & roasts
├── static/
│   ├── index.html           # Dystopian Cyberpunk single-page UI
│   ├── style.css            # Neon HUD glassmorphism & animation styles
│   └── app.js               # Evasive physics, Web Audio synth & API connector
├── tests/
│   └── test_captcha.py      # Unit test suite for API and level logic
├── requirements.txt         # FastAPI, uvicorn, pillow, pydantic
└── README.md
```

---

## Quickstart & Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

> **Dependencies Note:**
> - `fastapi` & `uvicorn`: API server & ASGI runner.
> - `pillow`: Dynamic server-side image rendering and character distortion.
> - `pydantic`: Request/response validation.

### 2. Run the Application
```bash
uvicorn backend.main:app --reload --port 8000
```

Open your browser and navigate to:
```
http://localhost:8000
```
Interactive API documentation is also available at `http://localhost:8000/docs`.

---

## Integration into Sibling FastAPI Apps

The CAPTCHA router is completely decoupled and can be merged into any existing FastAPI project in 2 lines of code:

```python
from fastapi import FastAPI
from backend.captcha_router import captcha_router

app = FastAPI()

# Mount the captcha subsystem under /captcha
app.include_router(captcha_router, prefix="/captcha")
```

### API Endpoints
- `GET /captcha/new?session_id=...&level=...`: Generates a dynamic challenge image and registers expected answer server-side.
- `POST /captcha/verify`: Verifies user input (`{ "session_id": "...", "answer": "..." }`).
- `POST /captcha/reset`: Resets session back to Level 1.
- `GET /captcha/health`: Health status of the subsystem.

---

## Running Tests
```bash
pytest
```
