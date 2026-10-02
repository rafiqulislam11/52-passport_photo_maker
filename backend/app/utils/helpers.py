import io
import base64
from PIL import Image

def image_to_base64_data_url(img: Image.Image, fmt: str = "JPEG", quality: int = 90) -> str:
    bio = io.BytesIO()
    if fmt.upper() in ("JPG", "JPEG"):
        img.convert("RGB").save(bio, format="JPEG", quality=quality)
        mime = "image/jpeg"
    elif fmt.upper() == "PNG":
        img.save(bio, format="PNG")
        mime = "image/png"
    else:
        img.save(bio, format=fmt)
        mime = f"image/{fmt.lower()}"
    bio.seek(0)
    encoded = base64.b64encode(bio.getvalue()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"
