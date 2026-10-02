import re
import uuid
import time
from pathlib import Path
from fastapi import HTTPException, Security, Request
from fastapi.security.api_key import APIKeyHeader
from PIL import Image
import io
from .config import settings

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Metrics tracker
class MetricsTracker:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.total_processing_time = 0.0

    def record_success(self, duration: float):
        self.total_requests += 1
        self.successful_requests += 1
        self.total_processing_time += duration

    def record_failure(self, duration: float = 0.0):
        self.total_requests += 1
        self.failed_requests += 1
        self.total_processing_time += duration

    def stats(self):
        avg_time = (self.total_processing_time / self.successful_requests) if self.successful_requests > 0 else 0.0
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "avg_processing_time_sec": round(avg_time, 3),
        }

metrics = MetricsTracker()

def verify_api_key(api_key: str | None = Security(api_key_header)) -> bool:
    if not settings.api_key_enabled:
        return True
    if not api_key or api_key != settings.app_api_key:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "message": "Invalid or missing API Key", "code": "UNAUTHORIZED"}
        )
    return True

def sanitize_filename(filename: str) -> str:
    # Remove path traversal tokens and illegal characters
    cleaned = re.sub(r'[/\\?%*:|"<>]', '_', filename)
    cleaned = re.sub(r'\.{2,}', '.', cleaned)
    base = Path(cleaned).name
    ext = Path(cleaned).suffix.lower()
    if not ext:
        ext = ".jpg"
    unique = uuid.uuid4().hex[:10]
    return f"{Path(base).stem[:30]}_{unique}{ext}"

def validate_image_file(raw_bytes: bytes, filename: str) -> tuple[int, int, str]:
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(raw_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail={"success": False, "message": f"File exceeds maximum upload limit of {settings.max_upload_mb} MB", "code": "FILE_TOO_LARGE"}
        )
    if not raw_bytes:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": "Uploaded file is empty", "code": "EMPTY_FILE"}
        )

    # Validate image header through PIL
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            img.verify()
            fmt = (img.format or "").upper()
            if fmt not in ("JPEG", "JPG", "PNG", "WEBP"):
                raise HTTPException(
                    status_code=400,
                    detail={"success": False, "message": f"Unsupported image format: {fmt}. Please upload JPG, PNG, or WEBP.", "code": "INVALID_FORMAT"}
                )
        # Re-open to read width & height
        with Image.open(io.BytesIO(raw_bytes)) as img:
            width, height = img.size
            return width, height, fmt
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=400,
            detail={"success": False, "message": f"Corrupted or invalid image file: {str(e)}", "code": "CORRUPT_IMAGE"}
        )

def cleanup_temp_files(max_age_seconds: int = 3600):
    now = time.time()
    for folder in (settings.temp_dir, settings.upload_dir, settings.output_dir):
        if not folder.exists():
            continue
        for file_path in folder.glob("*"):
            if file_path.is_file():
                try:
                    if now - file_path.stat().st_mtime > max_age_seconds:
                        file_path.unlink()
                except Exception:
                    pass
