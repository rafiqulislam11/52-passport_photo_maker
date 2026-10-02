import io
import requests
import cv2
import numpy as np
from PIL import Image, ImageFilter
from typing import Optional
from ..core.config import settings

# Try importing rembg and creating a reusable session
REMBG_AVAILABLE = False
try:
    from rembg import remove, new_session
    # Pre-warm session or initialize lazily
    _SESSION = None
    REMBG_AVAILABLE = True
except Exception:
    remove = None
    _SESSION = None

def get_rembg_session():
    global _SESSION
    if REMBG_AVAILABLE and _SESSION is None:
        try:
            _SESSION = new_session("u2netp")  # Lightweight and fast
        except Exception:
            try:
                _SESSION = new_session("u2net")
            except Exception:
                _SESSION = None
    return _SESSION

def remove_background_with_removebg_api(pil_img: Image.Image, api_key: str) -> Optional[Image.Image]:
    """
    Calls official remove.bg Real Cloud API to extract foreground subject.
    Returns transparent RGBA PIL Image if successful, or None on failure.
    """
    if not api_key or not api_key.strip():
        return None
    try:
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        buf.seek(0)

        response = requests.post(
            "https://api.remove.bg/v1.0/removebg",
            files={"image_file": ("image.png", buf.getvalue(), "image/png")},
            data={"size": "auto"},
            headers={"X-Api-Key": api_key.strip()},
            timeout=15,
        )

        if response.status_code == 200:
            result = Image.open(io.BytesIO(response.content)).convert("RGBA")
            # Slightly smooth alpha edge
            alpha = result.split()[3]
            alpha_smooth = alpha.filter(ImageFilter.GaussianBlur(radius=0.5))
            result.putalpha(alpha_smooth)
            return result
        else:
            print(f"[remove.bg API Warning] HTTP {response.status_code}: {response.text[:120]}")
    except Exception as e:
        print(f"[remove.bg API Error]: {e}")
    return None

def extract_foreground_rgba(pil_img: Image.Image, remove_bg_api_key: Optional[str] = None) -> Image.Image:
    """
    Extracts foreground subject with alpha transparency:
    1. If remove_bg_api_key is provided, attempts official remove.bg Real Cloud API.
    2. Otherwise or on failure, uses built-in local Deep Learning rembg (u2net ONNX).
    3. If rembg fails, falls back gracefully to OpenCV GrabCut segmentation.
    """
    # 1. Try Real External remove.bg API if key provided
    effective_api_key = remove_bg_api_key or getattr(settings, "remove_bg_api_key", None)
    if effective_api_key:
        api_result = remove_background_with_removebg_api(pil_img, effective_api_key)
        if api_result is not None:
            return api_result

    # 2. Local Deep Learning rembg
    if REMBG_AVAILABLE:
        try:
            session = get_rembg_session()
            img_rgba = pil_img.convert("RGBA")
            if session is not None:
                output = remove(img_rgba, session=session)
            else:
                output = remove(img_rgba)

            if isinstance(output, Image.Image):
                result = output.convert("RGBA")
            else:
                result = Image.open(io.BytesIO(output)).convert("RGBA")

            # Slightly feather the alpha edge for smoother blending
            alpha = result.split()[3]
            alpha_smooth = alpha.filter(ImageFilter.GaussianBlur(radius=0.5))
            result.putalpha(alpha_smooth)
            return result
        except Exception as e:
            # Log and fall back to OpenCV GrabCut
            pass

    # Fallback OpenCV GrabCut segmentation
    rgb = np.array(pil_img.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]

    # Mask initialization
    mask = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    # Margin rectangle around person
    rect = (int(w * 0.05), int(h * 0.05), int(w * 0.90), int(h * 0.90))

    try:
        cv2.grabCut(bgr, mask, rect, bgd_model, fgd_model, 4, cv2.GC_INIT_WITH_RECT)
        fg_mask = np.where((mask == cv2.GC_BGD) | (mask == cv2.GC_PR_BGD), 0, 255).astype(np.uint8)

        # Smooth mask edges
        fg_mask = cv2.GaussianBlur(fg_mask, (5, 5), 0)

        rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
        rgba[:, :, 3] = fg_mask
        return Image.fromarray(rgba)
    except Exception:
        return pil_img.convert("RGBA")

def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    clean_hex = hex_str.lstrip("#")
    if len(clean_hex) == 3:
        clean_hex = "".join([c * 2 for c in clean_hex])
    if len(clean_hex) != 6:
        return (255, 255, 255)
    return (
        int(clean_hex[0:2], 16),
        int(clean_hex[2:4], 16),
        int(clean_hex[4:6], 16)
    )

def compose_background(
    foreground_rgba: Image.Image,
    bg_type: str = "white",
    custom_color_hex: str = "#FFFFFF",
    custom_bg_img: Optional[Image.Image] = None
) -> Image.Image:
    """
    Pastes the foreground subject over the requested background type:
    - "white": pure white (255, 255, 255)
    - "light_blue": passport light blue (185, 217, 235)
    - "custom_color": custom hex color
    - "transparent": RGBA output
    - "custom_image": user-provided background image
    """
    if bg_type == "transparent":
        return foreground_rgba

    w, h = foreground_rgba.size

    if bg_type == "custom_image" and custom_bg_img is not None:
        bg_canvas = custom_bg_img.convert("RGB").resize((w, h), Image.Resampling.LANCZOS)
    else:
        if bg_type == "white":
            color = (255, 255, 255)
        elif bg_type == "light_blue":
            color = (185, 217, 235)  # Official passport light blue
        elif bg_type == "custom_color":
            color = hex_to_rgb(custom_color_hex)
        else:
            color = (255, 255, 255)

        bg_canvas = Image.new("RGB", (w, h), color)

    # Composite foreground on top of background
    alpha = foreground_rgba.split()[3]
    bg_canvas.paste(foreground_rgba, (0, 0), mask=alpha)
    return bg_canvas
