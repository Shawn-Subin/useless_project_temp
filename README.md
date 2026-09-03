<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# RatioBot  

A satirical mini-game where the user attempts to solve a CAPTCHA that gets progressively harder, weirder, and more evasive with each successful solve — ultimately becoming impossible on purpose for comedic effect, culminating in RatioBot (unhinged version) mercilessly roasting the user.

> **Statutory Notice:** *Assessment difficulty may increase in response to successful completion.*

---

## Basic Details
### Team Name: [Unemployed.exe]

### Team Members
- Team Lead: [Shawn Subin Philip] - [Muthoot Institute of Technology and Science]
- Member 2: [Cilen George Anil] - [Muthoot Institute of Technology and Science]

### Project Description
A dystopian security verification gateway featuring elusive, dodging buttons, an interactive rigged Tic-Tac-Toe minigame, and an impossible CAPTCHA that forces you to admit you are a bot — unlocking **RatioBot (unhinged version)**, an AI that roasts user questions with fabricated, hilarious explanations powered by Gemini.

### The Problem (that doesn't exist)
Websites are far too easy to log into, and artificial intelligences are far too polite, respectful, and helpful. Society desperately needs an antagonistic bureaucracy to humble human egos and test finger reflexes.

### The Solution (that nobody asked for)
An escalating 3-stage security gate where buttons run away from your mouse cursor, the AI cheats at Tic-Tac-Toe, Stage 3 is mathematically guaranteed to fail, and the unlocked AI chatbot roasts your existence with 100% confidence.

---

## Technical Details

### Technologies/Components Used
For Software:
- **Backend**: Python 3, FastAPI, Uvicorn, Pillow (PIL for server-side dynamic image generation & distortion), Pydantic
- **Frontend**: Vanilla HTML5, CSS3 (Neon cyberpunk glassmorphism & HUD aesthetics), JavaScript (ES6+), Web Audio API for interactive retro synth SFX
- **AI Integration**: Google Gemini API (`gemini-3.1-flash-lite`) with direct client calling and backend fallback
- **Testing**: Pytest & FastAPI TestClient

---

## Features & Escalating Levels

1. **Stage 1 — Routine Calibration**:
   - Clean alphanumeric CAPTCHA with high-contrast text and dynamic audio feedback.
2. **Stage 2 — Interactive Rigged Tic-Tac-Toe**:
   - The user is challenged to win a game of Tic-Tac-Toe to prove their humanity. The bot actively blocks and rigs the game for maximum frustration.
3. **Stage 3 — Kinetic Hyper-Scramble & The Evasive Escape**:
   - Eldritch void glyphs, physics-based runaway buttons that actively dodge the mouse cursor, and guaranteed server-side rejection (0% pass rate).
   - Only by clicking "I am a bot" or accepting defeat can you bypass security to enter the inner sanctum.
4. **RatioBot (Unhinged AI Chatbot)**:
   - Gemini-powered persona that delivers brutal roasts, absurd fake explanations, and relentless ratio energy with zero apologies.

---

## Project Structure

```
.
├── backend/
│   ├── __init__.py
│   ├── main.py              # Main FastAPI application entry point
│   ├── captcha_router.py    # Modular APIRouter (mounted at /captcha)
│   ├── captcha_engine.py    # Pillow CAPTCHA rendering engine + SVG fallback
│   ├── chat_router.py       # RatioBot AI chat router (/api/chat)
│   ├── session_manager.py   # In-memory session tracking & Despair metrics
│   ├── prompts.py           # RatioBot unhinged system prompts
│   └── copy_library.py      # Sarcastic taunts, level metadata & roasts
├── static/
│   ├── index.html           # Dystopian Cyberpunk single-page UI & Chat
│   ├── style.css            # Neon HUD glassmorphism & animation styles
│   └── app.js               # Evasive physics, Web Audio synth & API connector
├── tests/
│   ├── test_captcha.py      # Unit test suite for API and level logic
│   └── test_chat.py         # Unit test suite for RatioBot chat endpoint
├── requirements.txt         # FastAPI, uvicorn, pillow, pydantic
└── README.md
```

---

## Implementation

### Installation
```bash
pip install -r requirements.txt
```

### Run
```bash
uvicorn backend.main:app --reload --port 8000
```

Open your browser and navigate to:
```
http://localhost:8000
```

### Run Tests
```bash
pytest
```

---

## Project Documentation

### Screenshots
*(Add screenshots showing Stage 1 CAPTCHA, Stage 2 Rigged Tic-Tac-Toe, and RatioBot AI Chat)*

---

Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
