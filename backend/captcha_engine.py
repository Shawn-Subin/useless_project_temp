"""
CAPTCHA Generation Engine for Escalating reCAPTCHA Security Challenge (3 Stages).
1. Step 1: Normal standard wavy reCAPTCHA text
2. Step 2: Interactive Rigged Tic-Tac-Toe Grid
3. Step 3: Clean, easy-to-read text with an ultra-smooth evasive running button
"""

import io
import math
import random
import string
import base64
from typing import Tuple, Dict, Any

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False


class CaptchaEngine:
    """Core generator for 3-Stage escalating reCAPTCHA."""

    WIDTH = 380
    HEIGHT = 140

    @staticmethod
    def _random_code(length: int = 5, charset: str = None) -> str:
        if charset is None:
            charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
        return "".join(random.choice(charset) for _ in range(length))

    @classmethod
    def generate(cls, level: int) -> Tuple[str, str, Dict[str, Any]]:
        if level <= 1:
            return cls._generate_level_1()
        elif level == 2:
            return cls._generate_level_2()
        else:
            return cls._generate_level_3(level)

    # -------------------------------------------------------------------------
    # STAGE 1: Standard Normal Google reCAPTCHA Text
    # -------------------------------------------------------------------------
    @classmethod
    def _generate_level_1(cls) -> Tuple[str, str, Dict[str, Any]]:
        code = cls._random_code(5)
        if PILLOW_AVAILABLE:
            img = Image.new("RGB", (cls.WIDTH, cls.HEIGHT), color=(250, 250, 252))
            draw = ImageDraw.Draw(img)

            for _ in range(3):
                y1 = random.randint(20, cls.HEIGHT - 20)
                y2 = random.randint(20, cls.HEIGHT - 20)
                draw.line([(0, y1), (cls.WIDTH, y2)], fill=(215, 220, 230), width=1)

            font = cls._get_font(38)
            spacing = (cls.WIDTH - 60) // len(code)

            for i, char in enumerate(code):
                char_img = Image.new("RGBA", (70, 70), (0, 0, 0, 0))
                char_draw = ImageDraw.Draw(char_img)
                char_color = (32, 33, 36, 255) if i % 2 == 0 else (26, 115, 232, 255)
                char_draw.text((12, 10), char, font=font, fill=char_color)

                angle = random.randint(-14, 14)
                rotated = char_img.rotate(angle, expand=False, resample=Image.Resampling.BILINEAR)

                paste_x = 35 + (i * spacing)
                paste_y = 35 + int(6 * math.sin(i * 1.2))
                img.paste(rotated, (paste_x, paste_y), mask=rotated)

            points = []
            for px in range(0, cls.WIDTH, 4):
                py = int(70 + 12 * math.sin(px / 30.0))
                points.append((px, py))
            draw.line(points, fill=(66, 133, 244), width=2)

            data_uri = cls._img_to_data_uri(img)
        else:
            data_uri = cls._svg_fallback(code, bg="#fafafc", fg="#202124", subtitle="reCAPTCHA v2")

        meta = {
            "prompt_hint": "Type the characters you see in the image below",
            "audio_script": f"Verification code: {', '.join(list(code))}",
            "evasive_mode": False,
            "shake_mode": False,
            "scramble_mode": False,
            "is_minigame": False,
            "minigame_type": None,
            "level_badge": "STEP 1 OF 3"
        }
        return data_uri, code, meta

    # -------------------------------------------------------------------------
    # STAGE 2: Interactive Rigged Tic-Tac-Toe Grid Challenge
    # -------------------------------------------------------------------------
    @classmethod
    def _generate_level_2(cls) -> Tuple[str, str, Dict[str, Any]]:
        meta = {
            "prompt_hint": "Place 'X' in any square to verify human presence",
            "audio_script": "Interactive grid challenge. Place your mark to verify human presence.",
            "evasive_mode": False,
            "shake_mode": False,
            "scramble_mode": False,
            "is_minigame": True,
            "minigame_type": "tictactoe",
            "level_badge": "STEP 2 OF 3"
        }
        return cls._svg_fallback("3x3 MATRIX", bg="#f8f9fa", fg="#1a73e8", subtitle="Pattern Verification"), "TICTACTOE_PROCEED", meta

    # -------------------------------------------------------------------------
    # STAGE 3: Easy & Clear Captcha Text (with running evasive Verify button)
    # -------------------------------------------------------------------------
    @classmethod
    def _generate_level_3(cls, level: int) -> Tuple[str, str, Dict[str, Any]]:
        easy_words = ["HUMAN", "COOKIE", "EASY9", "ROBOT", "77889", "SPEED", "FAST4", "PIZZA"]
        code = random.choice(easy_words)

        if PILLOW_AVAILABLE:
            img = Image.new("RGB", (cls.WIDTH, cls.HEIGHT), color=(252, 252, 255))
            draw = ImageDraw.Draw(img)

            # Clean subtle grid lines
            for x in range(0, cls.WIDTH, 40):
                draw.line([(x, 0), (x, cls.HEIGHT)], fill=(235, 238, 245), width=1)
            for y in range(0, cls.HEIGHT, 30):
                draw.line([(0, y), (cls.WIDTH, y)], fill=(235, 238, 245), width=1)

            font = cls._get_font(44)
            bbox = draw.textbbox((0, 0), code, font=font)
            text_w = bbox[2] - bbox[0]
            tx = (cls.WIDTH - text_w) // 2

            # Crisp clear text
            draw.text((tx, 42), code, font=font, fill=(26, 115, 232))

            # Light accent wave
            points = [(px, int(98 + 4 * math.sin(px / 20.0))) for px in range(0, cls.WIDTH, 4)]
            draw.line(points, fill=(66, 133, 244), width=2)

            data_uri = cls._img_to_data_uri(img)
        else:
            data_uri = cls._svg_fallback(code, bg="#fcfcff", fg="#1a73e8", subtitle="Security Check (Easy)")

        meta = {
            "prompt_hint": "Type the text above and catch the Verify button!",
            "audio_script": f"Easy verification word: {', '.join(list(code))}",
            "evasive_mode": True,
            "shake_mode": False,
            "scramble_mode": False,
            "is_minigame": False,
            "minigame_type": None,
            "level_badge": "STEP 3 OF 3"
        }
        return data_uri, code, meta

    # -------------------------------------------------------------------------
    # Helper utilities
    # -------------------------------------------------------------------------
    @classmethod
    def _get_font(cls, size: int):
        try:
            for font_name in ["arial.ttf", "arialbd.ttf", "consola.ttf", "DejaVuSans-Bold.ttf", "calibri.ttf"]:
                try:
                    return ImageFont.truetype(font_name, size)
                except (IOError, OSError):
                    continue
            return ImageFont.load_default()
        except Exception:
            return None

    @classmethod
    def _img_to_data_uri(cls, img: "Image.Image") -> str:
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"

    @classmethod
    def _svg_fallback(cls, text: str, bg: str, fg: str, subtitle: str = "", distort: bool = False) -> str:
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{cls.WIDTH}" height="{cls.HEIGHT}" viewBox="0 0 {cls.WIDTH} {cls.HEIGHT}">
            <rect width="100%" height="100%" fill="{bg}"/>
            <text x="50%" y="28%" text-anchor="middle" fill="#5f6368" font-size="11" font-family="'Google Sans', 'Roboto', sans-serif" font-weight="bold">{subtitle}</text>
            <text x="50%" y="68%" text-anchor="middle" fill="{fg}" font-size="34" font-family="'Google Sans', 'Roboto', sans-serif" font-weight="700" letter-spacing="4px">{text}</text>
            <line x1="0" y1="{cls.HEIGHT-25}" x2="{cls.WIDTH}" y2="{cls.HEIGHT-25}" stroke="#4285f4" stroke-width="2" opacity="0.6"/>
        </svg>"""
        b64 = base64.b64encode(svg.encode("utf-8")).decode("utf-8")
        return f"data:image/svg+xml;base64,{b64}"
