from typing import Optional, Literal
from pydantic import BaseModel, Field

class ManualCropSettings(BaseModel):
    zoom: float = Field(default=1.0, ge=0.5, le=3.0)
    offset_x: float = Field(default=0.0, ge=-100.0, le=100.0)
    offset_y: float = Field(default=0.0, ge=-100.0, le=100.0)
    rotation: float = Field(default=0.0, ge=-45.0, le=45.0)

class PhotoProcessOptions(BaseModel):
    preset_id: str = "bangladesh_passport"
    photo_width_mm: float = Field(default=35.0, gt=5.0, le=150.0)
    photo_height_mm: float = Field(default=45.0, gt=5.0, le=200.0)
    unit: Literal["mm", "inch", "px"] = "mm"
    dpi: int = Field(default=300, ge=72, le=600)
    background_type: Literal["white", "light_blue", "custom_color", "transparent", "custom_image"] = "white"
    background_color: str = Field(default="#FFFFFF", pattern=r"^#[0-9a-fA-F]{6}$")
    auto_enhance: bool = True
    brightness: float = Field(default=0.0, ge=-50.0, le=50.0)
    contrast: float = Field(default=0.0, ge=-50.0, le=50.0)
    sharpness: float = Field(default=0.0, ge=-50.0, le=50.0)
    saturation: float = Field(default=0.0, ge=-50.0, le=50.0)
    exposure: float = Field(default=0.0, ge=-50.0, le=50.0)
    smooth_skin: bool = True
    auto_align: bool = True
    manual_crop: Optional[ManualCropSettings] = None

class A4LayoutOptions(BaseModel):
    paper_size: Literal["A4", "A5", "Letter"] = "A4"
    orientation: Literal["portrait", "landscape"] = "portrait"
    photos_per_row: int = Field(default=4, ge=1, le=10)
    horizontal_gap_mm: float = Field(default=4.0, ge=0.0, le=30.0)
    vertical_gap_mm: float = Field(default=4.0, ge=0.0, le=30.0)
    margin_top_mm: float = Field(default=10.0, ge=0.0, le=50.0)
    margin_bottom_mm: float = Field(default=10.0, ge=0.0, le=50.0)
    margin_left_mm: float = Field(default=10.0, ge=0.0, le=50.0)
    margin_right_mm: float = Field(default=10.0, ge=0.0, le=50.0)
    dpi: int = Field(default=300, ge=72, le=600)
    show_cut_lines: bool = True
    copies_count: Optional[int] = Field(default=None, ge=1, le=200)
    page_index: int = Field(default=0, ge=0)
