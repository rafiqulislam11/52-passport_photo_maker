from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    code: Optional[str] = None
    data: Optional[T] = None

class FaceDetectionInfo(BaseModel):
    detected: bool
    box: Optional[list[int]] = None  # [x, y, w, h]
    eyes: Optional[list[list[int]]] = None
    headroom_pct: Optional[float] = None
    face_height_pct: Optional[float] = None
    is_centered: Optional[bool] = None

class UploadData(BaseModel):
    file_id: str
    filename: str
    original_name: str
    width: int
    height: int
    format: str
    size_bytes: int
    preview_url: str
    face_info: Optional[FaceDetectionInfo] = None

class ProcessedPhotoData(BaseModel):
    file_id: str
    image_url: str
    download_jpg_url: str
    download_png_url: str
    width_px: int
    height_px: int
    width_mm: float
    height_mm: float
    dpi: int
    preset: str
    face_detected: bool
    processing_time_ms: float

class A4LayoutData(BaseModel):
    page_preview_url: str
    total_photos: int
    rows: int
    columns: int
    photos_per_page: int
    total_pages: int
    current_page: int
    paper_size: str
    paper_width_mm: float
    paper_height_mm: float
    usable_width_mm: float
    usable_height_mm: float
    photo_width_mm: float
    photo_height_mm: float
    fits: bool
    warning: Optional[str] = None
