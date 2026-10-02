import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, A5, LETTER
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from PIL import Image
from ..schemas.requests import A4LayoutOptions
from .layout_service import compute_layout_metrics

REPORTLAB_PAGE_SIZES = {
    "A4": A4,
    "A5": A5,
    "Letter": LETTER,
}

def mm_to_pt(mm: float) -> float:
    # 1 inch = 25.4 mm = 72 points
    return mm / 25.4 * 72.0

def generate_printable_pdf(
    photos: list[Image.Image],
    layout_opts: A4LayoutOptions,
    photo_w_mm: float,
    photo_h_mm: float,
    dpi: int = 300
) -> io.BytesIO:
    """
    Generates a 100% true-scale vector PDF ready for professional printing.
    Guarantees exact physical passport dimensions when printed with 'Actual Size / 100% Scale'.
    """
    base_page = REPORTLAB_PAGE_SIZES.get(layout_opts.paper_size, A4)
    if layout_opts.orientation == "landscape":
        page_w_pt, page_h_pt = max(base_page), min(base_page)
    else:
        page_w_pt, page_h_pt = min(base_page), max(base_page)

    pw_pt = mm_to_pt(photo_w_mm)
    ph_pt = mm_to_pt(photo_h_mm)
    h_gap_pt = mm_to_pt(layout_opts.horizontal_gap_mm)
    v_gap_pt = mm_to_pt(layout_opts.vertical_gap_mm)
    m_top_pt = mm_to_pt(layout_opts.margin_top_mm)
    m_left_pt = mm_to_pt(layout_opts.margin_left_mm)
    m_right_pt = mm_to_pt(layout_opts.margin_right_mm)

    meta, cols, rows, capacity = compute_layout_metrics(
        layout_opts, photo_w_mm, photo_h_mm, total_photos=len(photos)
    )

    if not meta.fits:
        raise ValueError(meta.warning or "Layout configuration does not fit on selected paper.")

    # Calculate horizontal centering inside margins
    grid_total_w_pt = cols * pw_pt + (cols - 1) * h_gap_pt
    start_x_pt = m_left_pt + max(0, ((page_w_pt - m_left_pt - m_right_pt) - grid_total_w_pt) / 2)

    total_photos_count = meta.total_photos
    total_pages = meta.total_pages

    pdf_stream = io.BytesIO()
    c = canvas.Canvas(pdf_stream, pagesize=(page_w_pt, page_h_pt))

    # Pre-render photo bytes
    cached_readers = []
    for img in photos:
        b = io.BytesIO()
        img.convert("RGB").save(b, format="JPEG", quality=95, dpi=(dpi, dpi))
        b.seek(0)
        cached_readers.append(ImageReader(b))

    for page_idx in range(total_pages):
        start_photo = page_idx * capacity
        end_photo = min(start_photo + capacity, total_photos_count)
        count_for_page = end_photo - start_photo

        for i in range(count_for_page):
            row = i // cols
            col = i % cols

            x_pt = start_x_pt + col * (pw_pt + h_gap_pt)
            # In ReportLab, origin (0,0) is bottom-left
            y_pt = page_h_pt - m_top_pt - (row + 1) * ph_pt - row * v_gap_pt

            reader = cached_readers[(start_photo + i) % len(cached_readers)]
            c.drawImage(
                reader,
                x_pt,
                y_pt,
                width=pw_pt,
                height=ph_pt,
                preserveAspectRatio=False
            )

            # Draw cutting guide lines
            if layout_opts.show_cut_lines:
                c.setStrokeColor(colors.HexColor("#C8CDD7"))
                c.setLineWidth(0.4)
                c.rect(x_pt, y_pt, pw_pt, ph_pt, stroke=1, fill=0)

        # Footer note (outside printable photo area)
        c.setFont("Helvetica", 6)
        c.setFillColor(colors.HexColor("#888888"))
        footer_text = f"Passport Photo Maker Pro • Page {page_idx + 1} of {total_pages} • Size: {photo_w_mm}x{photo_h_mm}mm • Scale: 100% (Do not fit/shrink to page)"
        c.drawString(m_left_pt, 12, footer_text)

        c.showPage()

    c.save()
    pdf_stream.seek(0)
    return pdf_stream
