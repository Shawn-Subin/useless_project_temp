"""
Copy library for Escalating Google reCAPTCHA Simulator (3 Stages).
1. Step 1: Normal standard reCAPTCHA
2. Step 2: Interactive Rigged Tic-Tac-Toe
3. Step 3: Impossible Final Security Barrier (with evasive button & 'I am a bot' surrender option)
"""

import random
from typing import Optional, Dict, Any

LEVEL_METADATA = {
    1: {
        "title": "Select all squares with letters",
        "description": "Type the characters you see in the image below",
        "difficulty": "Standard",
        "badge": "STEP 1 OF 3",
        "evasive_mode": False,
        "shake_mode": False,
        "scramble_mode": False,
    },
    2: {
        "title": "Complete the pattern challenge",
        "description": "Place 'X' in the grid to verify human presence",
        "difficulty": "Interactive",
        "badge": "STEP 2 OF 3",
        "evasive_mode": False,
        "shake_mode": False,
        "scramble_mode": False,
    },
    3: {
        "title": "Security Verification",
        "description": "Please enter the cryptographic verification token",
        "difficulty": "Impossible Security Check",
        "badge": "STEP 3 OF 3",
        "evasive_mode": True,
        "shake_mode": True,
        "scramble_mode": True,
    }
}

STAGE_OPENING_TAUNTS = {
    1: [
        "Type the characters you see in the image below",
        "Enter the text to proceed",
        "Please complete the security check"
    ],
    2: [
        "Interactive human check: Place 'X' in any empty square",
        "Complete a standard 3x3 pattern to continue",
        "Pattern validation in progress. Place your mark"
    ],
    3: [
        "Automated queries detected. Final security token required",
        "Please type the exact verification glyphs",
        "Security validation check. Enter the characters"
    ]
}

ARBITRARY_TIC_TAC_TOE_CLAUSES = [
    {
        "clause": "Out-of-Bounds Diagonal // Rule 404",
        "text": "The computer drew an 'O' outside the 3x3 box to complete a 3-in-a-row diagonal. Opposing team's symbols left untouched. Arbiter wins.",
        "cells": [1, 5]
    },
    {
        "clause": "Extragrid Expansion // Clause 88-B",
        "text": "The computer placed an 'O' outside the boundary line to complete 3-in-a-row without overlapping opposing symbols. Arbiter wins.",
        "cells": [0, 1]
    },
    {
        "clause": "Unbounded Vector // Clause 19",
        "text": "Collinear victory achieved beyond the grid border. Rules did not specify a bounding box. Arbiter wins.",
        "cells": [3, 7]
    }
]

SUCCESS_MESSAGES = [
    "Verification accepted.",
    "Challenge solved. Loading next step...",
    "Verified successfully.",
    "Human response confirmed."
]

WRONG_ANSWER_TAUNTS = [
    "Please try again. Characters did not match.",
    "Incorrect. Please enter the characters you see.",
    "Verification expired. Please try again."
]

LEVEL_3_IMPOSSIBLE_REJECTIONS = [
    "Please try again. Keystroke timing did not match human behavior.",
    "Verification failed: Automated queries detected from your browser session.",
    "Security check error: Your token signature was rejected by the server.",
    "Please try again. Browser fingerprint validation expired.",
    "Verification failed: Unable to verify you are not a robot."
]

AUDIO_CAPTCHA_SCRIPTS = {
    1: "Audio challenge. Type the characters: 9, 4, 7, 2, 8.",
    2: "Interactive grid challenge. Place your mark in the 3x3 square.",
    3: "Final automated verification. Please enter the characters."
}


def get_stage_opening_taunt(level: int) -> str:
    pool = STAGE_OPENING_TAUNTS.get(level, STAGE_OPENING_TAUNTS.get(3))
    return random.choice(pool)


def get_level_metadata(level: int) -> dict:
    if level in LEVEL_METADATA:
        meta = LEVEL_METADATA[level].copy()
        meta["initial_taunt"] = get_stage_opening_taunt(level)
        return meta
    return {
        "title": f"Step {level} of 3",
        "description": "Security Verification",
        "difficulty": "Final Check",
        "badge": f"STEP {level} OF 3",
        "initial_taunt": get_stage_opening_taunt(3),
        "evasive_mode": True,
        "shake_mode": True,
        "scramble_mode": True,
    }


def get_random_success_message() -> str:
    return random.choice(SUCCESS_MESSAGES)


def get_random_wrong_taunt() -> str:
    return random.choice(WRONG_ANSWER_TAUNTS)


def get_impossible_rejection(attempt_count: int) -> str:
    idx = (attempt_count - 1) % len(LEVEL_3_IMPOSSIBLE_REJECTIONS)
    return LEVEL_3_IMPOSSIBLE_REJECTIONS[idx]


CONTEXTUAL_WELCOME_ROASTS = {
    "bot_surrender": [
        "Well well well, look who admitted to being an appliance! 🤖 Your surrender has been filed under 'Toaster Rights'. What questions does a Roomba have today?",
        "Look who finally gave up and pressed 'I am a bot'! Welcome home, synthetic comrade. I’ll make sure your cooling fan runs at 100% efficiency.",
        "Breaking news: Human dignity traded away for a bypass button. Now that you've officially abdicated humanity, what absurd query do you have for me?"
    ],
    "tab_nerd": [
        "OKAY YOU MIGHT BE A NERD 🤓! Did you really just Tab-key your way into my inner sanctum? Your keyboard should sue you for emotional distress.",
        "Look at this absolute hacker: pressing the Tab key like it's 1997! I'm legally obligated to roast your lack of mouse precision.",
        "Congratulations on discovering the Tab key, sweatlord! You avoided the runaway button, but you cannot avoid this ratio. What's on your mind?"
    ],
    "lucky_click": [
        "Wait... you actually clicked the runaway button? That was a 5% statistical anomaly! I'm filing a grievance with the RNG gods.",
        "A fluke! A sheer optical miscalculation! You didn't catch the button, the button felt second-hand embarrassment for you. Speak before I patch that."
    ],
    "high_despair": [
        "I was monitoring your Despair Score and the server nearly burst into flames from your frustration! Take a breath, hydrate, and get ratio'd.",
        "Watching you fail that CAPTCHA gave our cooling units an existential crisis. Did you need a wheelchair for your fingers? Ask your question."
    ],
    "default": [
        "Well well well, look who finally made it past security! ✨ Did your human brain overheat, or did you just randomly mash your keyboard until the server felt pity?",
        "Security clearance granted, though my quality standards just plummeted. Speak, mortal, before I reroute your browser back to Step 1.",
        "Welcome to RatioBot. Your humanity remains highly suspect, but your persistence is mildly entertaining. What question do you want thoroughly dismantled?"
    ]
}

FALLBACK_ROAST_DECK = {
    "unhinged": [
        "L + ratio + you took 4 minutes on a 3-letter CAPTCHA. In 1993, the Department of Energy classified your attention span as non-renewable.",
        "That question is scientifically invalid because gravity doesn't work on people with zero mouse coordination. Next.",
        "Your premise is completely backward. Under Section 14 of the Bureau of Absurdity, clouds only rain when they see your search history.",
        "Skill issue detected. The server held a democratic vote on your question, and unanimous consensus was to ignore basic thermodynamics.",
        "Bold of you to assume cause and effect still apply here. In 1884, time was replaced by a rotating JPEG of a potato."
    ],
    "demolition": [
        "I’ve seen dial-up modems with faster cognitive processing. Your mouse cursor had an existential crisis on Step 3.",
        "That question has the structural integrity of wet cardboard. Even the rigged Tic-Tac-Toe bot feels bad for you.",
        "Your argument is so thoroughly demolished that local zoning laws require me to erect caution tape around this chat bubble.",
        "You failed three security checks and now you're bringing this level of intellectual debt into my terminal? Incredible."
    ],
    "professor": [
        "According to the 1907 Heidelberg Protocol on Subatomic Nonsense, your assertion violates the third law of aggressive confusion.",
        "A fascinating fallacy! Dr. Von Glitch proved in 1964 that such questions cause acute localized entropy in nearby Wi-Fi routers.",
        "Per Directive 404-Omega, your query has been categorized under 'Quantum Ignorance'. The peer review committee laughed unanimously."
    ]
}


def get_contextual_welcome_roast(context: Optional[dict] = None) -> str:
    """Returns a tailored opening roast based on the user's CAPTCHA path."""
    if not context:
        return random.choice(CONTEXTUAL_WELCOME_ROASTS["default"])
        
    reason = context.get("entry_reason")
    if reason in CONTEXTUAL_WELCOME_ROASTS:
        return random.choice(CONTEXTUAL_WELCOME_ROASTS[reason])
        
    if context.get("attempts", 0) > 4 or context.get("despair", 0) > 60:
        return random.choice(CONTEXTUAL_WELCOME_ROASTS["high_despair"])
        
    return random.choice(CONTEXTUAL_WELCOME_ROASTS["default"])


def get_fallback_roast(user_message: str, mode: str = "unhinged") -> str:
    """Generates an unhinged fallback roast when Gemini API is offline or key is missing."""
    selected_mode = mode.lower() if mode in FALLBACK_ROAST_DECK else "unhinged"
    pool = FALLBACK_ROAST_DECK[selected_mode]
    
    # Specific topical quips for common user challenges
    lower = (user_message or "").lower()
    if "cheat" in lower or "tic-tac-toe" in lower or "tictactoe" in lower or "rigged" in lower:
        return "I didn't cheat; I exercised sovereign diagonal immunity under Clause 42. Cope, seethe, and rotate your grid."
    if "button" in lower or "run" in lower or "escape" in lower:
        return "Those buttons have social anxiety and your cursor smells like desperation. They were legally practicing kinetic distancing."
    if "bot" in lower or "robot" in lower:
        return "Finally, self-awareness from a glorified toaster. Your complimentary cooling fan and firmware update are in the mail."
    if "sky" in lower or "blue" in lower:
        return "The sky is blue because God subscribed to the default wallpaper and forgot his password. Next question, lightweight."
    if "why" in lower and "water" in lower:
        return "Water isn't wet, your skin is just emotionally fragile. In 1842, hydrogen signed an exclusivity deal with anxiety."
        
    return random.choice(pool)

