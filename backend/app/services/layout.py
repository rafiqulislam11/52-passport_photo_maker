from __future__ import annotations
import io, math
from PIL import Image, ImageOps
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, A5, LETTER
from reportlab.lib.utils import ImageReader

PAGE_SIZES = {"A4": A4, "A5": A5, "Letter": LETTER}

def mm(v: float) -> float: return v / 25.4 * 72

def make_sheet(images, width_mm, height_mm, per_row=4, gap_mm=4, margin_mm=10, dpi=300, page_size="A4"):
    page_w, page_h = PAGE_SIZES.get(page_size, A4)
    pw, ph, gap, margin = mm(width_mm), mm(height_mm), mm(gap_mm), mm(margin_mm)
    if per_row < 1: raise ValueError("photos_per_row must be at least 1")
    usable_w = page_w - 2 * margin
    required_w = per_row * pw + (per_row - 1) * gap
    if required_w > usable_w + 0.01:
        raise ValueError(f"Layout width does not fit {page_size}. Reduce photo width, gap or photos per row.")
    rows_per_page = max(1, int((page_h - 2 * margin + gap) // (ph + gap)))
    capacity = per_row * rows_per_page
    out = io.BytesIO(); c = canvas.Canvas(out, pagesize=(page_w, page_h))
    for start in range(0, len(images), capacity):
        page_images = images[start:start + capacity]
        for j, img in enumerate(page_images):
            row, col = divmod(j, per_row)
            x = (page_w - required_w) / 2 + col * (pw + gap)
            y = page_h - margin - (row + 1) * ph - row * gap
            b = io.BytesIO(); img.save(b, "JPEG", quality=95, dpi=(dpi, dpi)); b.seek(0)
            c.drawImage(ImageReader(b), x, y, width=pw, height=ph, preserveAspectRatio=False)
        c.showPage()
    c.save(); out.seek(0); return out

def make_preview(images, width_mm, height_mm, per_row=4, gap_mm=4, margin_mm=10, page_size="A4"):
    scale = 3
    page_w_mm, page_h_mm = (210, 297) if page_size == "A4" else ((148, 210) if page_size == "A5" else (216, 279))
    W, H = round(mm(width_mm)*scale), round(mm(height_mm)*scale)
    gap, margin = round(mm(gap_mm)*scale), round(mm(margin_mm)*scale)
    page_w, page_h = round(mm(page_w_mm)*scale), round(mm(page_h_mm)*scale)
    sheet = Image.new("RGB", (page_w, page_h), "white")
    required_w = 4 * W + 3 * gap
    per_row = max(1, per_row)
    required_w = per_row * W + (per_row - 1) * gap
    start_x = max(0, (page_w - required_w)//2)
    for i, img in enumerate(images):
        r, c = divmod(i, per_row)
        x, y = start_x + c*(W+gap), page_h-margin-(r+1)*H-r*gap
        if x+W <= page_w and y >= 0:
            sheet.paste(img.resize((W,H), Image.Resampling.LANCZOS), (x,y))
    out=io.BytesIO(); sheet.save(out,"PNG"); out.seek(0); return out
