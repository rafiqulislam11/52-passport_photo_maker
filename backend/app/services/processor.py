from __future__ import annotations
import io, os, zipfile, tempfile
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

try:
    from rembg import remove
except Exception:
    remove = None

FACE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def mm_to_px(mm: float, dpi: int) -> int:
    return max(1, round(mm / 25.4 * dpi))

def detect_face(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = FACE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80,80))
    if len(faces) == 0:
        return None
    return max(faces, key=lambda r: r[2]*r[3])

def remove_background(pil: Image.Image) -> Image.Image:
    if remove is not None:
        try:
            out = remove(pil.convert("RGBA"))
            if isinstance(out, Image.Image): return out.convert("RGBA")
            return Image.open(io.BytesIO(out)).convert("RGBA")
        except Exception:
            pass
    # Lightweight fallback: estimate foreground with GrabCut around detected face.
    rgb = np.array(pil.convert("RGB"))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    h,w = bgr.shape[:2]
    face = detect_face(bgr)
    mask = np.zeros((h,w), np.uint8)
    if face:
        x,y,fw,fh = face
        rect = (max(0,x-int(fw*1.5)), max(0,y-int(fh*2.0)), min(w-1, int(fw*4)), min(h-1, int(fh*5)))
    else:
        rect = (int(w*.1), int(h*.05), int(w*.8), int(h*.9))
    bgd = np.zeros((1,65),np.float64); fgd=np.zeros((1,65),np.float64)
    try:
        cv2.grabCut(bgr, mask, rect, bgd, fgd, 4, cv2.GC_INIT_WITH_RECT)
        alpha = np.where((mask==2)|(mask==0),0,255).astype(np.uint8)
        rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA); rgba[:,:,3]=alpha
        return Image.fromarray(rgba)
    except Exception:
        return pil.convert("RGBA")

def enhance(img: Image.Image) -> Image.Image:
    img = ImageEnhance.Contrast(img).enhance(1.06)
    img = ImageEnhance.Color(img).enhance(1.04)
    img = ImageEnhance.Sharpness(img).enhance(1.18)
    return img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=100, threshold=2))

def crop_to_passport(pil: Image.Image, width_px: int, height_px: int, center_face=True) -> Image.Image:
    rgba = pil.convert("RGBA")
    bg = Image.new("RGB", rgba.size, "white"); bg.paste(rgba, mask=rgba.getchannel("A")); img=bg
    w,h=img.size; target=width_px/height_px
    face = detect_face(cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)) if center_face else None
    if face:
        x,y,fw,fh=face
        # Include shoulders and headroom. Aim for face around upper-middle area.
        top=max(0, int(y-fh*1.0)); bottom=min(h, int(y+fh*3.2))
        crop_h=bottom-top
        crop_w=int(crop_h*target)
        cx=x+fw/2
        left=int(cx-crop_w/2)
        left=max(0,min(left,w-crop_w))
        if crop_w>w:
            crop_w=w; crop_h=int(crop_w/target); top=max(0,min(int(y+fh*1.4-crop_h*.45),h-crop_h)); left=0
        box=(left,top,left+crop_w,top+crop_h)
    else:
        if w/h>target:
            crop_h=h; crop_w=int(h*target); left=(w-crop_w)//2; top=0
        else:
            crop_w=w; crop_h=int(w/target); left=0; top=(h-crop_h)//2
        box=(left,top,left+crop_w,top+crop_h)
    return img.crop(box).resize((width_px,height_px), Image.Resampling.LANCZOS)

def process_one(data: bytes, options) -> Image.Image:
    source=Image.open(io.BytesIO(data)).convert("RGB")
    fg=remove_background(source)
    if options.background=="white": color=(255,255,255)
    elif options.background=="blue": color=(67,118,194)
    else:
        hx=options.custom_background.lstrip('#'); color=tuple(int(hx[i:i+2],16) for i in (0,2,4))
    canvas=Image.new("RGB", fg.size, color); canvas.paste(fg, mask=fg.getchannel("A"))
    if options.enhance: canvas=enhance(canvas)
    return crop_to_passport(canvas, mm_to_px(options.photo_width_mm, options.dpi), mm_to_px(options.photo_height_mm, options.dpi), options.face_center)

def zip_images(images, dpi):
    bio=io.BytesIO()
    with zipfile.ZipFile(bio,"w",zipfile.ZIP_DEFLATED) as z:
        for i,img in enumerate(images,1):
            b=io.BytesIO(); img.save(b,"JPEG",quality=95,dpi=(dpi,dpi)); z.writestr(f"passport_{i:02d}.jpg",b.getvalue())
    bio.seek(0); return bio
