import io
import os
import uuid
import base64
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from PIL import Image

from ..core.config import settings
from ..core.security import verify_api_key, sanitize_filename, validate_image_file, metrics
from ..schemas.requests import PhotoProcessOptions, A4LayoutOptions, ManualCropSettings
from ..schemas.responses import APIResponse, UploadData, ProcessedPhotoData, A4LayoutData, FaceDetectionInfo
from ..services.face_service import analyze_face, detect_face_in_image
from ..processors.pipeline import run_photo_processing_pipeline
from ..services.layout_service import render_a4_page_preview, compute_layout_metrics, auto_fit_layout
from ..services.pdf_service import generate_printable_pdf
from ..services.export_service import export_single_photo, export_batch_zip

router = APIRouter(prefix="/api")

# Predefined Passport & Visa Presets
PRESETS = [
    {
        "id": "bangladesh_passport",
        "name": "Bangladesh Passport",
        "country": "Bangladesh",
        "width_mm": 35.0,
        "height_mm": 45.0,
        "unit": "mm",
        "default_dpi": 300,
        "description": "35 × 45 mm (Standard BD E-Passport & Machine Readable Passport)",
    },
    {
        "id": "standard_passport",
        "name": "Standard Passport (ICAO / EU / UK)",
        "country": "International / UK / EU / Australia",
        "width_mm": 35.0,
        "height_mm": 45.0,
        "unit": "mm",
        "default_dpi": 300,
        "description": "35 × 45 mm (Standard Biometric ICAO 9303)",
    },
    {
        "id": "us_passport",
        "name": "US Passport / Visa (2×2 inch)",
        "country": "United States / India / Philippines",
        "width_mm": 50.8,
        "height_mm": 50.8,
        "unit": "inch",
        "default_dpi": 300,
        "description": "51 × 51 mm / 2 × 2 inch (Square Passport Photo)",
    },
    {
        "id": "schengen_visa",
        "name": "Schengen Visa (35×45 mm)",
        "country": "European Schengen Area",
        "width_mm": 35.0,
        "height_mm": 45.0,
        "unit": "mm",
        "default_dpi": 300,
        "description": "35 × 45 mm (Light gray or white background)",
    },
    {
        "id": "visa_40x50",
        "name": "Visa (40×50 mm)",
        "country": "Singapore / Russia / Canada Visa",
        "width_mm": 40.0,
        "height_mm": 50.0,
        "unit": "mm",
        "default_dpi": 300,
        "description": "40 × 50 mm Portrait",
    },
    {
        "id": "visa_45x55",
        "name": "Visa (45×55 mm)",
        "country": "Saudi Arabia / Malaysia / Japan",
        "width_mm": 45.0,
        "height_mm": 55.0,
        "unit": "mm",
        "default_dpi": 300,
        "description": "45 × 55 mm Large Portrait",
    },
    {
        "id": "custom",
        "name": "Custom Dimensions",
        "country": "Custom",
        "width_mm": 35.0,
        "height_mm": 45.0,
        "unit": "mm",
        "default_dpi": 300,
        "description": "User-defined width, height, and unit (mm / inch / px)",
    },
]

# In-memory storage of recent uploads for fast pipeline chaining
UPLOAD_CACHE: dict[str, tuple[str, bytes]] = {}
PROCESSED_CACHE: dict[str, Image.Image] = {}

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
        "api_key_enabled": settings.api_key_enabled,
    }

@router.get("/presets")
def get_presets():
    return {
        "success": True,
        "message": "Presets fetched successfully",
        "data": PRESETS
    }

@router.get("/sample-photo")
def get_sample_photo():
    asset_path = Path(__file__).resolve().parent.parent / "assets" / "demo_portrait.jpg"
    if asset_path.exists():
        return FileResponse(asset_path, media_type="image/jpeg")
    temp_sample = settings.temp_dir / "sample_portrait.jpg"
    if temp_sample.exists():
        return FileResponse(temp_sample, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Sample photo not found")


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    auth: bool = Depends(verify_api_key)
):
    try:
        raw_bytes = await file.read()
        w, h, fmt = validate_image_file(raw_bytes, file.filename or "image.jpg")
        safe_name = sanitize_filename(file.filename or "upload.jpg")
        file_id = str(uuid.uuid4())

        # Save to uploads directory
        save_path = settings.upload_dir / f"{file_id}_{safe_name}"
        with open(save_path, "wb") as f:
            f.write(raw_bytes)

        # Store in cache
        UPLOAD_CACHE[file_id] = (file.filename or safe_name, raw_bytes)

        # Detect face information for instant feedback
        with Image.open(io.BytesIO(raw_bytes)) as pil_img:
            import cv2
            import numpy as np
            bgr = cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
            face_info = analyze_face(bgr)

        # Generate lightweight base64 thumbnail for instant preview
        with Image.open(io.BytesIO(raw_bytes)) as pil_img:
            thumb = pil_img.copy()
            thumb.thumbnail((400, 400), Image.Resampling.LANCZOS)
            thumb_bio = io.BytesIO()
            thumb.convert("RGB").save(thumb_bio, format="JPEG", quality=85)
            b64_thumb = f"data:image/jpeg;base64,{base64.b64encode(thumb_bio.getvalue()).decode('utf-8')}"

        metrics.record_success(0.05)

        data = UploadData(
            file_id=file_id,
            filename=safe_name,
            original_name=file.filename or "photo.jpg",
            width=w,
            height=h,
            format=fmt,
            size_bytes=len(raw_bytes),
            preview_url=b64_thumb,
            face_info=face_info,
        )

        return {
            "success": True,
            "message": "Image uploaded and analyzed successfully",
            "data": data.model_dump()
        }
    except HTTPException:
        metrics.record_failure()
        raise
    except Exception as e:
        metrics.record_failure()
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"Upload failed: {str(e)}", "code": "UPLOAD_ERROR"}
        )

@router.post("/process")
async def process_photo(
    file_id: str = Form(None),
    file: UploadFile = File(None),
    options_json: str = Form(...),
    custom_bg_file: UploadFile = File(None),
    auth: bool = Depends(verify_api_key)
):
    try:
        # Determine source raw bytes
        if file is not None:
            raw_bytes = await file.read()
            validate_image_file(raw_bytes, file.filename or "photo.jpg")
            active_file_id = str(uuid.uuid4())
            UPLOAD_CACHE[active_file_id] = (file.filename or "photo.jpg", raw_bytes)
        elif file_id and file_id in UPLOAD_CACHE:
            active_file_id = file_id
            _, raw_bytes = UPLOAD_CACHE[file_id]
        else:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": "No valid image uploaded or file_id provided.", "code": "MISSING_IMAGE"}
            )

        # Parse options JSON
        opts_dict = json.loads(options_json)
        options = PhotoProcessOptions(**opts_dict)

        # Check for optional custom background image
        custom_bg_bytes = None
        if custom_bg_file:
            custom_bg_bytes = await custom_bg_file.read()

        # Run pipeline
        processed_img, result_data = run_photo_processing_pipeline(
            raw_bytes=raw_bytes,
            options=options,
            custom_bg_bytes=custom_bg_bytes
        )

        # Cache processed image
        result_id = str(uuid.uuid4())
        PROCESSED_CACHE[result_id] = processed_img
        # Also map to active_file_id
        PROCESSED_CACHE[active_file_id] = processed_img

        # Save to disk
        output_filename = f"passport_{result_id}.jpg"
        output_path = settings.output_dir / output_filename
        processed_img.convert("RGB").save(output_path, format="JPEG", quality=95, dpi=(options.dpi, options.dpi))

        # Generate data URL for instant zero-latency UI preview
        img_bio = io.BytesIO()
        if options.background_type == "transparent":
            processed_img.save(img_bio, format="PNG", dpi=(options.dpi, options.dpi))
            mime = "image/png"
        else:
            processed_img.convert("RGB").save(img_bio, format="JPEG", quality=95, dpi=(options.dpi, options.dpi))
            mime = "image/jpeg"

        b64_img = f"data:{mime};base64,{base64.b64encode(img_bio.getvalue()).decode('utf-8')}"

        result_data.file_id = result_id
        result_data.image_url = b64_img
        result_data.download_jpg_url = f"/api/download/{result_id}?fmt=jpg&dpi={options.dpi}"
        result_data.download_png_url = f"/api/download/{result_id}?fmt=png&dpi={options.dpi}"

        metrics.record_success(result_data.processing_time_ms / 1000.0)

        return {
            "success": True,
            "message": "Photo processed successfully",
            "data": result_data.model_dump()
        }
    except HTTPException:
        metrics.record_failure()
        raise
    except Exception as e:
        metrics.record_failure()
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"Processing error: {str(e)}", "code": "PROCESS_ERROR"}
        )

@router.get("/download/{file_id}")
def download_photo(
    file_id: str,
    fmt: str = Query("jpg", pattern="^(jpg|jpeg|png)$"),
    dpi: int = Query(300, ge=72, le=600)
):
    if file_id not in PROCESSED_CACHE:
        # Check disk
        path_jpg = settings.output_dir / f"passport_{file_id}.jpg"
        if path_jpg.exists():
            with Image.open(path_jpg) as img:
                PROCESSED_CACHE[file_id] = img.copy()
        else:
            raise HTTPException(status_code=404, detail="File not found")

    img = PROCESSED_CACHE[file_id]
    bio = export_single_photo(img, fmt=fmt, dpi=dpi)
    media_type = "image/png" if fmt.lower() == "png" else "image/jpeg"
    filename = f"passport-photo.{fmt.lower()}"

    return StreamingResponse(
        bio,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/a4-preview")
async def a4_preview(
    file_id: str = Form(None),
    file: UploadFile = File(None),
    layout_json: str = Form(...),
    photo_w_mm: float = Form(35.0),
    photo_h_mm: float = Form(45.0),
    copies_count: int = Form(12),
    auth: bool = Depends(verify_api_key)
):
    try:
        layout_dict = json.loads(layout_json)
        layout_opts = A4LayoutOptions(**layout_dict)
        layout_opts.copies_count = copies_count

        # Get processed photo
        img = None
        if file is not None:
            raw = await file.read()
            img = Image.open(io.BytesIO(raw))
        elif file_id and file_id in PROCESSED_CACHE:
            img = PROCESSED_CACHE[file_id]
        elif file_id and file_id in UPLOAD_CACHE:
            _, raw = UPLOAD_CACHE[file_id]
            img = Image.open(io.BytesIO(raw))
        else:
            # Generate placeholder template photo if none provided yet
            img = Image.new("RGB", (413, 531), (240, 243, 246))

        photos_list = [img] * copies_count

        sheet_preview, meta = render_a4_page_preview(
            photos=photos_list,
            layout_opts=layout_opts,
            photo_w_mm=photo_w_mm,
            photo_h_mm=photo_h_mm,
            dpi=150
        )

        bio = io.BytesIO()
        sheet_preview.save(bio, format="PNG")
        b64_sheet = f"data:image/png;base64,{base64.b64encode(bio.getvalue()).decode('utf-8')}"
        meta.page_preview_url = b64_sheet

        metrics.record_success(0.08)

        return {
            "success": True,
            "message": "A4 layout preview generated successfully",
            "data": meta.model_dump()
        }
    except Exception as e:
        metrics.record_failure()
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"A4 Preview failed: {str(e)}", "code": "PREVIEW_ERROR"}
        )

@router.post("/a4-sheet")
async def a4_sheet_download(
    file_id: str = Form(...),
    layout_json: str = Form(...),
    photo_w_mm: float = Form(35.0),
    photo_h_mm: float = Form(45.0),
    copies_count: int = Form(12),
    fmt: str = Form("jpg"),
    auth: bool = Depends(verify_api_key)
):
    try:
        layout_dict = json.loads(layout_json)
        layout_opts = A4LayoutOptions(**layout_dict)
        layout_opts.copies_count = copies_count

        if file_id not in PROCESSED_CACHE:
            raise HTTPException(status_code=404, detail="Processed photo not found. Please process first.")

        img = PROCESSED_CACHE[file_id]
        photos_list = [img] * copies_count

        # Render at print DPI (e.g. 300)
        sheet_img, _ = render_a4_page_preview(
            photos=photos_list,
            layout_opts=layout_opts,
            photo_w_mm=photo_w_mm,
            photo_h_mm=photo_h_mm,
            dpi=layout_opts.dpi
        )

        bio = io.BytesIO()
        if fmt.lower() == "png":
            sheet_img.save(bio, format="PNG", dpi=(layout_opts.dpi, layout_opts.dpi))
            media_type = "image/png"
            ext = "png"
        else:
            sheet_img.convert("RGB").save(bio, format="JPEG", quality=95, dpi=(layout_opts.dpi, layout_opts.dpi))
            media_type = "image/jpeg"
            ext = "jpg"

        bio.seek(0)
        return StreamingResponse(
            bio,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename=A4-Passport-Sheet.{ext}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"Sheet export failed: {str(e)}", "code": "SHEET_ERROR"}
        )

@router.post("/export/pdf")
async def export_pdf(
    file_id: str = Form(...),
    layout_json: str = Form(...),
    photo_w_mm: float = Form(35.0),
    photo_h_mm: float = Form(45.0),
    copies_count: int = Form(12),
    auth: bool = Depends(verify_api_key)
):
    try:
        layout_dict = json.loads(layout_json)
        layout_opts = A4LayoutOptions(**layout_dict)
        layout_opts.copies_count = copies_count

        if file_id not in PROCESSED_CACHE:
            raise HTTPException(status_code=404, detail="Photo not found")

        img = PROCESSED_CACHE[file_id]
        photos_list = [img] * copies_count

        pdf_stream = generate_printable_pdf(
            photos=photos_list,
            layout_opts=layout_opts,
            photo_w_mm=photo_w_mm,
            photo_h_mm=photo_h_mm,
            dpi=layout_opts.dpi
        )

        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Passport-Photo-A4-Print.pdf"}
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail={"success": False, "message": str(ve), "code": "LAYOUT_OVERFLOW"})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"success": False, "message": f"PDF generation error: {str(e)}", "code": "PDF_ERROR"})

@router.post("/export/zip")
async def export_zip(
    file_ids_json: str = Form(...),
    layout_json: str = Form(...),
    photo_w_mm: float = Form(35.0),
    photo_h_mm: float = Form(45.0),
    copies_count: int = Form(12),
    auth: bool = Depends(verify_api_key)
):
    try:
        file_ids: list[str] = json.loads(file_ids_json)
        layout_dict = json.loads(layout_json)
        layout_opts = A4LayoutOptions(**layout_dict)
        layout_opts.copies_count = copies_count

        photos_tuples: list[tuple[str, Image.Image]] = []
        for fid in file_ids:
            if fid in PROCESSED_CACHE:
                photos_tuples.append((fid, PROCESSED_CACHE[fid]))

        if not photos_tuples:
            raise HTTPException(status_code=400, detail="No processed photos found for ZIP export")

        first_img = photos_tuples[0][1]
        photos_list = [first_img] * copies_count

        # Generate PDF for inclusion in ZIP
        pdf_stream = generate_printable_pdf(
            photos=photos_list,
            layout_opts=layout_opts,
            photo_w_mm=photo_w_mm,
            photo_h_mm=photo_h_mm,
            dpi=layout_opts.dpi
        )

        # Generate sheet preview image for inclusion in ZIP
        sheet_img, _ = render_a4_page_preview(
            photos=photos_list,
            layout_opts=layout_opts,
            photo_w_mm=photo_w_mm,
            photo_h_mm=photo_h_mm,
            dpi=150
        )

        zip_stream = export_batch_zip(
            photos=photos_tuples,
            pdf_bytes=pdf_stream,
            sheet_image=sheet_img,
            dpi=layout_opts.dpi
        )

        return StreamingResponse(
            zip_stream,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=Passport-Photo-Maker-Package.zip"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": f"ZIP export failed: {str(e)}", "code": "ZIP_ERROR"}
        )

@router.get("/stats")
def get_stats(auth: bool = Depends(verify_api_key)):
    return {
        "success": True,
        "message": "Stats fetched successfully",
        "data": metrics.stats()
    }
