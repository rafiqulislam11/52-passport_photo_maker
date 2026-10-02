import io
import zipfile
from PIL import Image
from typing import List

def export_single_photo(
    photo: Image.Image,
    fmt: str = "JPEG",
    dpi: int = 300,
    quality: int = 95
) -> io.BytesIO:
    bio = io.BytesIO()
    fmt_upper = fmt.upper()
    if fmt_upper in ("JPG", "JPEG"):
        rgb = photo.convert("RGB")
        rgb.save(bio, format="JPEG", quality=quality, dpi=(dpi, dpi), subsampling=0)
    elif fmt_upper == "PNG":
        photo.save(bio, format="PNG", dpi=(dpi, dpi))
    else:
        photo.save(bio, format=fmt_upper)
    bio.seek(0)
    return bio

def export_batch_zip(
    photos: list[tuple[str, Image.Image]],
    pdf_bytes: io.BytesIO | None = None,
    sheet_image: Image.Image | None = None,
    dpi: int = 300
) -> io.BytesIO:
    """
    Creates a neatly organized ZIP archive containing:
    - individual passport photos (JPG)
    - print-ready A4 PDF (if provided)
    - print-ready A4 sheet image (if provided)
    """
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        # Add individual passport photos
        for idx, (filename_base, img) in enumerate(photos, 1):
            jpg_buf = io.BytesIO()
            img.convert("RGB").save(jpg_buf, format="JPEG", quality=95, dpi=(dpi, dpi))
            clean_name = f"passport-photo-{idx:03d}.jpg"
            zf.writestr(f"individual_photos/{clean_name}", jpg_buf.getvalue())

        # Add A4 PDF
        if pdf_bytes is not None:
            pdf_bytes.seek(0)
            zf.writestr("A4-Sheet-Printable.pdf", pdf_bytes.getvalue())

        # Add A4 Sheet Image
        if sheet_image is not None:
            sheet_buf = io.BytesIO()
            sheet_image.convert("RGB").save(sheet_buf, format="JPEG", quality=95, dpi=(dpi, dpi))
            zf.writestr("A4-Sheet-Preview.jpg", sheet_buf.getvalue())

    zip_buffer.seek(0)
    return zip_buffer
