from pydantic import BaseModel, Field

class PhotoOptions(BaseModel):
    background: str = Field(default="white", pattern=r"^(white|blue|custom)$")
    custom_background: str = Field(default="#FFFFFF", pattern=r"^#[0-9A-Fa-f]{6}$")
    photo_width_mm: float = Field(default=35, gt=10, le=100)
    photo_height_mm: float = Field(default=45, gt=10, le=150)
    dpi: int = Field(default=300, ge=72, le=600)
    enhance: bool = True
    face_center: bool = True

class SheetOptions(PhotoOptions):
    photos_per_row: int = Field(default=4, ge=1, le=10)
    gap_mm: float = Field(default=4, ge=0, le=20)
    margin_mm: float = Field(default=10, ge=0, le=30)
