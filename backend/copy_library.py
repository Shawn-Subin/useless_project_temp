"""
Copy library for Escalating Google reCAPTCHA Simulator (3 Stages).
1. Step 1: Normal standard reCAPTCHA
2. Step 2: Interactive Rigged Tic-Tac-Toe
3. Step 3: Impossible Final Security Barrier (with evasive button & 'I am a bot' surrender option)
"""

import random

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
        "clause": "Pattern Validation Error // Clause 42-A",
        "text": "The security arbiter has completed an orthogonal victory vector. Please proceed to the final check.",
        "cells": [0, 1, 4]
    },
    {
        "clause": "Boundary Check Failed // Clause 19",
        "text": "Three non-collinear boundary tiles constitute checkmate under Security Protocol 19.",
        "cells": [0, 2, 8]
    },
    {
        "clause": "Toroidal Jump Detected // Clause 7",
        "text": "The verification system has executed a diagonal jump across wrapped margins.",
        "cells": [1, 5, 6]
    },
    {
        "clause": "Center Monopoly Enforced // Clause 104-F",
        "text": "The center row has been claimed by the verification system. Please continue to the final step.",
        "cells": [3, 4, 5]
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
