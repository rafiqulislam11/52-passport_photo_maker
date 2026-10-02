import io
import math
from typing import Tuple, Optional
from PIL import Image, ImageDraw
from ..schemas.requests import A4LayoutOptions
from ..schemas.responses import A4LayoutData

PAPER_SIZES_MM = {
    "A4": (210.0, 297.0),
    "A5": (148.0, 210.0),
    "Letter": (215.9, 279.4),
}

def mm_to_px(mm: float, dpi: int) -> int:
    return max(1, round(mm / 25.4 * dpi))

def compute_layout_metrics(
    layout_opts: A4LayoutOptions,
    photo_w_mm: float,
    photo_h_mm: float,
    total_photos: int = 12
) -> tuple[A4LayoutData, int, int, int]:
    """
    Computes exact grid metrics, page capacity, total pages, and validation.
    Returns: (A4LayoutData, cols, rows, per_page_capacity)
    """
    paper_base = PAPER_SIZES_MM.get(layout_opts.paper_size, (210.0, 297.0))
    if layout_opts.orientation == "landscape":
        paper_w_mm, paper_h_mm = max(paper_base), min(paper_base)
    else:
        paper_w_mm, paper_h_mm = min(paper_base), max(paper_base)

    usable_w_mm = paper_w_mm - layout_opts.margin_left_mm - layout_opts.margin_right_mm
    usable_h_mm = paper_h_mm - layout_opts.margin_top_mm - layout_opts.margin_bottom_mm

    cols = max(1, layout_opts.photos_per_row)

    # Required width for `cols` photos with gaps
    required_w_mm = cols * photo_w_mm + (cols - 1) * layout_opts.horizontal_gap_mm

    # Max rows that fit in usable height
    if usable_h_mm < photo_h_mm:
        rows = 0
    else:
        rows = int((usable_h_mm + layout_opts.vertical_gap_mm) // (photo_h_mm + layout_opts.vertical_gap_mm))

    fits = (required_w_mm <= usable_w_mm + 0.5) and (rows >= 1)
    warning = None
    if required_w_mm > usable_w_mm + 0.5:
        warning = f"Required width ({required_w_mm:.1f} mm) exceeds usable page width ({usable_w_mm:.1f} mm). Reduce photos per row or photo width."
    elif rows == 0:
        warning = "Photo height exceeds printable page height. Reduce top/bottom margins or photo height."

    per_page_capacity = cols * max(1, rows)
    copies = layout_opts.copies_count if layout_opts.copies_count is not None else per_page_capacity
    total_pages = max(1, math.ceil(copies / per_page_capacity)) if per_page_capacity > 0 else 1
    current_page = min(max(0, layout_opts.page_index), total_pages - 1)

    data = A4LayoutData(
        page_preview_url="",
        total_photos=copies,
        rows=rows,
        columns=cols,
        photos_per_page=per_page_capacity,
        total_pages=total_pages,
        current_page=current_page,
        paper_size=layout_opts.paper_size,
        paper_width_mm=paper_w_mm,
        paper_height_mm=paper_h_mm,
        usable_width_mm=usable_w_mm,
        usable_height_mm=usable_h_mm,
        photo_width_mm=photo_w_mm,
        photo_height_mm=photo_h_mm,
        fits=fits,
        warning=warning
    )

    return data, cols, rows, per_page_capacity

def auto_fit_layout(
    paper_size: str,
    orientation: str,
    photo_w_mm: float,
    photo_h_mm: float,
    gap_mm: float = 4.0,
    margin_mm: float = 10.0
) -> int:
    """
    Calculates the optimal number of photos per row that will maximize
    the number of photos fitting on the sheet without clipping.
    """
    paper_base = PAPER_SIZES_MM.get(paper_size, (210.0, 297.0))
    if orientation == "landscape":
        pw, ph = max(paper_base), min(paper_base)
    else:
        pw, ph = min(paper_base), max(paper_base)

    usable_w = pw - 2 * margin_mm
    usable_h = ph - 2 * margin_mm

    # Max possible columns
    max_cols = int((usable_w + gap_mm) // (photo_w_mm + gap_mm))
    return max(1, min(10, max_cols))

def render_a4_page_preview(
    photos: list[Image.Image],
    layout_opts: A4LayoutOptions,
    photo_w_mm: float,
    photo_h_mm: float,
    dpi: int = 150  # 150 DPI is crisp and fast for preview rendering
) -> tuple[Image.Image, A4LayoutData]:
    """
    Renders a realistic visual representation of the paper sheet with photos,
    margins, cut lines, and layout alignment.
    """
    meta, cols, rows, capacity = compute_layout_metrics(
        layout_opts, photo_w_mm, photo_h_mm, total_photos=len(photos)
    )

    page_w_px = mm_to_px(meta.paper_width_mm, dpi)
    page_h_px = mm_to_px(meta.paper_height_mm, dpi)

    photo_w_px = mm_to_px(photo_w_mm, dpi)
    photo_h_px = mm_to_px(photo_h_mm, dpi)

    h_gap_px = mm_to_px(layout_opts.horizontal_gap_mm, dpi)
    v_gap_px = mm_to_px(layout_opts.vertical_gap_mm, dpi)

    m_top_px = mm_to_px(layout_opts.margin_top_mm, dpi)
    m_left_px = mm_to_px(layout_opts.margin_left_mm, dpi)

    # Crisp pure white paper canvas
    canvas = Image.new("RGB", (page_w_px, page_h_px), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # Draw subtle printable margin boundaries (dashed/light gray)
    margin_w = page_w_px - mm_to_px(layout_opts.margin_right_mm, dpi)
    margin_h = page_h_px - mm_to_px(layout_opts.margin_bottom_mm, dpi)
    draw.rectangle([m_left_px, m_top_px, margin_w, margin_h], outline=(235, 238, 242), width=1)

    # Center grid horizontally in the printable area
    grid_total_w_px = cols * photo_w_px + (cols - 1) * h_gap_px
    start_x_px = m_left_px + max(0, ((page_w_px - m_left_px - mm_to_px(layout_opts.margin_right_mm, dpi)) - grid_total_w_px) // 2)

    # Determine photo slice for the current page
    page_index = meta.current_page
    start_idx = page_index * capacity
    end_idx = min(start_idx + capacity, meta.total_photos)
    page_photos_count = max(0, end_idx - start_idx)

    for i in range(page_photos_count):
        row = i // cols
        col = i % cols

        x = start_x_px + col * (photo_w_px + h_gap_px)
        y = m_top_px + row * (photo_h_px + v_gap_px)

        if x + photo_w_px > page_w_px or y + photo_h_px > page_h_px:
            continue

        # Get photo or loop over available photos
        photo_source = photos[(start_idx + i) % len(photos)] if photos else None

        if photo_source is not None:
            resized = photo_source.convert("RGB").resize((photo_w_px, photo_h_px), Image.Resampling.LANCZOS)
            canvas.paste(resized, (x, y))

        # Draw cut guidelines (subtle thin gray line)
        if layout_opts.show_cut_lines:
            draw.rectangle([x, y, x + photo_w_px, y + photo_h_px], outline=(200, 205, 215), width=1)

    return canvas, meta
