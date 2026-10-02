import time
import io
from PIL import Image
from ..schemas.requests import PhotoProcessOptions
from ..schemas.responses import ProcessedPhotoData, FaceDetectionInfo
from ..services.face_service import detect_face_in_image, crop_and_align_passport
from ..services.background_service import extract_foreground_rgba, compose_background
from ..services.enhance_service import enhance_passport_photo
from ..services.layout_service import mm_to_px

def run_photo_processing_pipeline(
    raw_bytes: bytes,
    options: PhotoProcessOptions,
    custom_bg_bytes: bytes | None = None
) -> tuple[Image.Image, ProcessedPhotoData]:
    start_time = time.perf_counter()

    # Step 1: Decode image
    source_img = Image.open(io.BytesIO(raw_bytes))

    # Calculate target pixel dimensions based on mm and DPI
    target_w_px = mm_to_px(options.photo_width_mm, options.dpi)
    target_h_px = mm_to_px(options.photo_height_mm, options.dpi)

    # Step 2: Auto crop and align face or framing
    framed_img = crop_and_align_passport(
        source_img,
        target_width_px=target_w_px,
        target_height_px=target_h_px,
        auto_align=options.auto_align,
        manual=options.manual_crop
    )

    # Step 3: Background removal & composition
    custom_bg_img = None
    if custom_bg_bytes:
        try:
            custom_bg_img = Image.open(io.BytesIO(custom_bg_bytes))
        except Exception:
            custom_bg_img = None

    foreground_rgba = extract_foreground_rgba(framed_img)
    composed_img = compose_background(
        foreground_rgba=foreground_rgba,
        bg_type=options.background_type,
        custom_color_hex=options.background_color,
        custom_bg_img=custom_bg_img
    )

    # Step 4: Photo Enhancement
    enhanced_img = enhance_passport_photo(
        composed_img,
        auto_enhance=options.auto_enhance,
        brightness=options.brightness,
        contrast=options.contrast,
        sharpness=options.sharpness,
        saturation=options.saturation,
        exposure=options.exposure,
        smooth_skin=options.smooth_skin
    )

    # Step 5: High-quality Lanczos final sizing check
    if enhanced_img.size != (target_w_px, target_h_px):
        enhanced_img = enhanced_img.resize((target_w_px, target_h_px), Image.Resampling.LANCZOS)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 1)

    result_data = ProcessedPhotoData(
        file_id="",
        image_url="",
        download_jpg_url="",
        download_png_url="",
        width_px=target_w_px,
        height_px=target_h_px,
        width_mm=options.photo_width_mm,
        height_mm=options.photo_height_mm,
        dpi=options.dpi,
        preset=options.preset_id,
        face_detected=True,
        processing_time_ms=duration_ms
    )

    return enhanced_img, result_data
