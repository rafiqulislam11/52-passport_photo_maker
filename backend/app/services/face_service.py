import cv2
import numpy as np
from PIL import Image
from typing import Optional, Tuple
from ..schemas.responses import FaceDetectionInfo
from ..schemas.requests import ManualCropSettings

# Load OpenCV cascades
CASCADE_FACE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
CASCADE_EYE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
CASCADE_PROFILE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")

def detect_face_in_image(image_bgr: np.ndarray) -> tuple[Optional[tuple[int, int, int, int]], list[tuple[int, int]]]:
    """
    Detects the primary face and eyes in an image.
    Returns: (bounding_box (x, y, w, h), list of eye_centers [(x, y)])
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    # Enhance contrast for detection
    gray = cv2.equalizeHist(gray)

    faces = CASCADE_FACE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=4,
        minSize=(60, 60),
        flags=cv2.CASCADE_SCALE_IMAGE
    )

    if len(faces) == 0:
        # Fallback to profile cascade
        faces = CASCADE_PROFILE.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(60, 60)
        )

    if len(faces) == 0:
        return None, []

    # Pick the largest face by area (closest to camera)
    primary_face = max(faces, key=lambda f: f[2] * f[3])
    x, y, w, h = primary_face

    # Detect eyes within upper 60% of face box
    face_roi_gray = gray[y : y + int(h * 0.65), x : x + w]
    eyes = CASCADE_EYE.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15))

    eye_centers = []
    for ex, ey, ew, eh in eyes[:2]:
        eye_centers.append((int(x + ex + ew / 2), int(y + ey + eh / 2)))

    return (int(x), int(y), int(w), int(h)), eye_centers

def analyze_face(image_bgr: np.ndarray) -> FaceDetectionInfo:
    face_box, eyes = detect_face_in_image(image_bgr)
    img_h, img_w = image_bgr.shape[:2]

    if not face_box:
        return FaceDetectionInfo(
            detected=False,
            box=None,
            eyes=None,
            headroom_pct=None,
            face_height_pct=None,
            is_centered=None,
        )

    x, y, w, h = face_box
    face_height_pct = round((h / img_h) * 100, 1)
    headroom_pct = round((y / img_h) * 100, 1)
    center_offset = abs((x + w / 2) - (img_w / 2)) / img_w
    is_centered = center_offset < 0.10

    return FaceDetectionInfo(
        detected=True,
        box=[x, y, w, h],
        eyes=[[ex, ey] for ex, ey in eyes],
        headroom_pct=headroom_pct,
        face_height_pct=face_height_pct,
        is_centered=is_centered,
    )

def crop_and_align_passport(
    pil_img: Image.Image,
    target_width_px: int,
    target_height_px: int,
    auto_align: bool = True,
    manual: Optional[ManualCropSettings] = None
) -> Image.Image:
    """
    Crops image to passport proportions with professional framing:
    - Head height occupying 70-80% of photo frame
    - Headroom above hair 8-10%
    - Horizontal centering
    - Natural shoulders inclusion
    """
    # Apply rotation first if manual rotation specified
    if manual and manual.rotation != 0:
        pil_img = pil_img.rotate(manual.rotation, resample=Image.Resampling.BICUBIC, expand=False)

    w, h = pil_img.size
    aspect_ratio = target_width_px / target_height_px

    bgr = cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
    face_box, eyes = detect_face_in_image(bgr) if auto_align else (None, [])

    if face_box:
        fx, fy, fw, fh = face_box

        # In standard biometric photos (ICAO):
        # The face + hair occupies ~70-75% of total frame height.
        # Headroom above the hair top is ~8-10% of total height.
        # Estimate crown top around fy - fh * 0.25 (accounting for hair)
        crown_y = max(0, fy - int(fh * 0.25))
        chin_y = min(h, fy + int(fh * 1.05))
        head_height = chin_y - crown_y

        # Total crop height needed so head_height is ~72% of crop_height
        crop_h = int(head_height / 0.72)
        crop_w = int(crop_h * aspect_ratio)

        # Center face horizontally
        face_center_x = fx + fw / 2
        crop_x1 = int(face_center_x - crop_w / 2)
        # Position crown at ~8% from top of crop
        crop_y1 = int(crown_y - crop_h * 0.08)

        # Ensure inside bounds or scale if crop exceeds image
        if crop_w > w or crop_h > h:
            scale = min(w / crop_w, h / crop_h)
            crop_w = int(crop_w * scale)
            crop_h = int(crop_h * scale)
            crop_x1 = int(face_center_x - crop_w / 2)
            crop_y1 = int(crown_y - crop_h * 0.08)

        # Clamp bounds
        crop_x1 = max(0, min(crop_x1, w - crop_w))
        crop_y1 = max(0, min(crop_y1, h - crop_h))
        crop_x2 = crop_x1 + crop_w
        crop_y2 = crop_y1 + crop_h

    else:
        # Default center crop maintaining passport aspect ratio
        if w / h > aspect_ratio:
            crop_h = h
            crop_w = int(h * aspect_ratio)
            crop_x1 = (w - crop_w) // 2
            crop_y1 = 0
        else:
            crop_w = w
            crop_h = int(w / aspect_ratio)
            crop_x1 = 0
            crop_y1 = int(h * 0.15)  # Slightly upper biased for portraits
            if crop_y1 + crop_h > h:
                crop_y1 = h - crop_h
        crop_x2 = crop_x1 + crop_w
        crop_y2 = crop_y1 + crop_h

    # Apply manual adjustments if specified
    if manual:
        zoom = manual.zoom
        if zoom != 1.0:
            cx = (crop_x1 + crop_x2) / 2
            cy = (crop_y1 + crop_y2) / 2
            new_w = crop_w / zoom
            new_h = crop_h / zoom
            crop_x1 = int(cx - new_w / 2)
            crop_x2 = int(cx + new_w / 2)
            crop_y1 = int(cy - new_h / 2)
            crop_y2 = int(cy + new_h / 2)

        # Offset translation (percentage of crop dimensions)
        shift_x = int(manual.offset_x / 100.0 * crop_w)
        shift_y = int(manual.offset_y / 100.0 * crop_h)
        crop_x1 += shift_x
        crop_x2 += shift_x
        crop_y1 += shift_y
        crop_y2 += shift_y

    # Clamp safely to image boundaries
    crop_x1 = max(0, min(crop_x1, w - 10))
    crop_y1 = max(0, min(crop_y1, h - 10))
    crop_x2 = max(crop_x1 + 10, min(crop_x2, w))
    crop_y2 = max(crop_y1 + 10, min(crop_y2, h))

    cropped = pil_img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    # High-quality Lanczos resampling
    return cropped.resize((target_width_px, target_height_px), Image.Resampling.LANCZOS)
