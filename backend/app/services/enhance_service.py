import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

def auto_white_balance_gray_world(img_bgr: np.ndarray) -> np.ndarray:
    """
    Applies Gray World white balance to neutralize indoor warm or fluorescent casts.
    """
    b, g, r = cv2.split(img_bgr)
    b_avg = np.mean(b)
    g_avg = np.mean(g)
    r_avg = np.mean(r)

    # Avoid divide by zero
    if b_avg == 0 or g_avg == 0 or r_avg == 0:
        return img_bgr

    k = (b_avg + g_avg + r_avg) / 3.0
    kb = k / b_avg
    kg = k / g_avg
    kr = k / r_avg

    # Gentle weight to avoid over-correcting natural skin warmth
    weight = 0.55
    kb = 1.0 + (kb - 1.0) * weight
    kg = 1.0 + (kg - 1.0) * weight
    kr = 1.0 + (kr - 1.0) * weight

    b = np.clip(b * kb, 0, 255).astype(np.uint8)
    g = np.clip(g * kg, 0, 255).astype(np.uint8)
    r = np.clip(r * kr, 0, 255).astype(np.uint8)

    return cv2.merge([b, g, r])

def mild_skin_smoothing(img_bgr: np.ndarray) -> np.ndarray:
    """
    Applies a subtle bilateral filter to smooth skin texture and micro-noise
    while preserving edge sharpness of eyes, pupils, hair strands, and lips.
    """
    smoothed = cv2.bilateralFilter(img_bgr, d=7, sigmaColor=35, sigmaSpace=35)
    # Blend 65% smoothed + 35% original to keep natural skin pores
    return cv2.addWeighted(smoothed, 0.65, img_bgr, 0.35, 0)

def enhance_passport_photo(
    pil_img: Image.Image,
    auto_enhance: bool = True,
    brightness: float = 0.0,
    contrast: float = 0.0,
    sharpness: float = 0.0,
    saturation: float = 0.0,
    exposure: float = 0.0,
    smooth_skin: bool = True
) -> Image.Image:
    """
    Professional passport photo enhancement pipeline.
    Ensures natural, document-compliant aesthetic without artificial look.
    """
    is_rgba = (pil_img.mode == "RGBA")
    if is_rgba:
        alpha = pil_img.split()[3]
        working_img = pil_img.convert("RGB")
    else:
        alpha = None
        working_img = pil_img.convert("RGB")

    # Step 1: Automated enhancements in OpenCV if enabled
    if auto_enhance:
        np_img = np.array(working_img)
        bgr = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

        # White balance correction
        bgr = auto_white_balance_gray_world(bgr)

        # Natural skin smoothing (if enabled)
        if smooth_skin:
            bgr = mild_skin_smoothing(bgr)

        # Convert back to PIL
        working_img = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))

        # Subtle contrast and color balancing
        working_img = ImageEnhance.Contrast(working_img).enhance(1.05)
        working_img = ImageEnhance.Color(working_img).enhance(1.04)
        working_img = ImageEnhance.Sharpness(working_img).enhance(1.15)
        # Gentle unsharp mask for clarity in hair and eyes
        working_img = working_img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))

    # Step 2: Manual Slider adjustments (-50 to +50 scale)
    # Map -50..+50 to factor multipliers (e.g. 0 -> 1.0, 50 -> 1.5, -50 -> 0.5)
    if exposure != 0.0:
        factor = 1.0 + (exposure / 100.0)
        working_img = ImageEnhance.Brightness(working_img).enhance(factor)

    if brightness != 0.0:
        factor = 1.0 + (brightness / 100.0)
        working_img = ImageEnhance.Brightness(working_img).enhance(factor)

    if contrast != 0.0:
        factor = 1.0 + (contrast / 100.0)
        working_img = ImageEnhance.Contrast(working_img).enhance(factor)

    if saturation != 0.0:
        factor = 1.0 + (saturation / 100.0)
        working_img = ImageEnhance.Color(working_img).enhance(factor)

    if sharpness != 0.0:
        factor = 1.0 + (sharpness / 50.0)
        if factor > 0:
            working_img = ImageEnhance.Sharpness(working_img).enhance(factor)

    if is_rgba and alpha is not None:
        working_img.putalpha(alpha)

    return working_img
