import io
import json
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from app.main import app
from app.core.config import settings

client = TestClient(app)

def create_synthetic_portrait_image(width=600, height=800, with_face=True) -> bytes:
    """
    Creates a synthetic portrait image with simulated head, eyes, and shoulders
    for deterministic automated testing.
    """
    img = Image.new("RGB", (width, height), (180, 200, 220))
    draw = ImageDraw.Draw(img)

    if with_face:
        # Draw shoulders
        draw.ellipse([width * 0.1, height * 0.65, width * 0.9, height * 1.2], fill=(40, 60, 100))
        # Draw neck
        draw.rectangle([width * 0.42, height * 0.50, width * 0.58, height * 0.70], fill=(230, 195, 170))
        # Draw head / face oval
        draw.ellipse([width * 0.30, height * 0.20, width * 0.70, height * 0.60], fill=(240, 205, 180))
        # Draw hair
        draw.arc([width * 0.28, height * 0.18, width * 0.72, height * 0.45], 180, 360, fill=(30, 20, 15), width=20)
        # Draw eyes
        draw.ellipse([width * 0.40, height * 0.35, width * 0.44, height * 0.38], fill=(20, 20, 20))
        draw.ellipse([width * 0.56, height * 0.35, width * 0.60, height * 0.38], fill=(20, 20, 20))
        # Draw mouth
        draw.line([width * 0.45, height * 0.50, width * 0.55, height * 0.50], fill=(180, 60, 60), width=4)

    bio = io.BytesIO()
    img.save(bio, format="JPEG", quality=95)
    return bio.getvalue()

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_presets():
    response = client.get("/api/presets")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    presets = data["data"]
    assert len(presets) >= 4
    # Check Bangladesh and US Presets
    bd = next((p for p in presets if p["id"] == "bangladesh_passport"), None)
    assert bd is not None
    assert bd["width_mm"] == 35.0
    assert bd["height_mm"] == 45.0

def test_upload_valid_image():
    raw_img = create_synthetic_portrait_image(with_face=True)
    files = {"file": ("test_portrait.jpg", raw_img, "image/jpeg")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "file_id" in res["data"]
    assert res["data"]["width"] == 600
    assert res["data"]["height"] == 800

def test_upload_invalid_file():
    # Attempt uploading random text bytes disguised as jpg
    fake_bytes = b"NOT_A_REAL_IMAGE_FILE_DATA_12345"
    files = {"file": ("bad_file.jpg", fake_bytes, "image/jpeg")}
    response = client.post("/api/upload", files=files)
    assert response.status_code == 400

def test_process_photo():
    raw_img = create_synthetic_portrait_image(with_face=True)
    options = {
        "preset_id": "bangladesh_passport",
        "photo_width_mm": 35.0,
        "photo_height_mm": 45.0,
        "unit": "mm",
        "dpi": 300,
        "background_type": "white",
        "background_color": "#FFFFFF",
        "auto_enhance": True,
        "auto_align": True
    }
    files = {"file": ("portrait.jpg", raw_img, "image/jpeg")}
    data = {"options_json": json.dumps(options)}

    response = client.post("/api/process", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data_out = res["data"]
    assert data_out["width_px"] > 0
    assert data_out["height_px"] > 0
    assert data_out["image_url"].startswith("data:image/")

def test_a4_layout_and_preview():
    raw_img = create_synthetic_portrait_image(with_face=True)
    # First upload and process
    proc_files = {"file": ("p.jpg", raw_img, "image/jpeg")}
    opts = {"preset_id": "standard_passport", "photo_width_mm": 35.0, "photo_height_mm": 45.0, "dpi": 300}
    proc_resp = client.post("/api/process", files=proc_files, data={"options_json": json.dumps(opts)})
    file_id = proc_resp.json()["data"]["file_id"]

    # Preview layout
    layout_opts = {
        "paper_size": "A4",
        "orientation": "portrait",
        "photos_per_row": 4,
        "horizontal_gap_mm": 4.0,
        "vertical_gap_mm": 4.0,
        "margin_top_mm": 10.0,
        "margin_bottom_mm": 10.0,
        "margin_left_mm": 10.0,
        "margin_right_mm": 10.0,
        "dpi": 150,
        "show_cut_lines": True
    }
    preview_data = {
        "file_id": file_id,
        "layout_json": json.dumps(layout_opts),
        "photo_w_mm": 35.0,
        "photo_h_mm": 45.0,
        "copies_count": 12
    }
    prev_resp = client.post("/api/a4-preview", data=preview_data)
    assert prev_resp.status_code == 200
    prev_json = prev_resp.json()
    assert prev_json["success"] is True
    assert prev_json["data"]["columns"] == 4
    assert prev_json["data"]["fits"] is True
    assert prev_json["data"]["page_preview_url"].startswith("data:image/png;base64,")

def test_pdf_generation():
    raw_img = create_synthetic_portrait_image(with_face=True)
    proc_files = {"file": ("p2.jpg", raw_img, "image/jpeg")}
    opts = {"preset_id": "standard_passport", "photo_width_mm": 35.0, "photo_height_mm": 45.0, "dpi": 300}
    proc_resp = client.post("/api/process", files=proc_files, data={"options_json": json.dumps(opts)})
    file_id = proc_resp.json()["data"]["file_id"]

    layout_opts = {
        "paper_size": "A4",
        "orientation": "portrait",
        "photos_per_row": 4,
        "horizontal_gap_mm": 4.0,
        "vertical_gap_mm": 4.0,
        "margin_top_mm": 10.0,
        "margin_bottom_mm": 10.0,
        "margin_left_mm": 10.0,
        "margin_right_mm": 10.0,
        "dpi": 300,
        "show_cut_lines": True
    }
    pdf_req = {
        "file_id": file_id,
        "layout_json": json.dumps(layout_opts),
        "photo_w_mm": 35.0,
        "photo_h_mm": 45.0,
        "copies_count": 8
    }
    pdf_resp = client.post("/api/export/pdf", data=pdf_req)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000
    assert pdf_resp.content.startswith(b"%PDF")

def test_zip_export():
    raw_img = create_synthetic_portrait_image(with_face=True)
    proc_files = {"file": ("p3.jpg", raw_img, "image/jpeg")}
    opts = {"preset_id": "standard_passport", "photo_width_mm": 35.0, "photo_height_mm": 45.0, "dpi": 300}
    proc_resp = client.post("/api/process", files=proc_files, data={"options_json": json.dumps(opts)})
    file_id = proc_resp.json()["data"]["file_id"]

    layout_opts = {
        "paper_size": "A4",
        "orientation": "portrait",
        "photos_per_row": 4,
        "horizontal_gap_mm": 4.0,
        "vertical_gap_mm": 4.0,
        "margin_top_mm": 10.0,
        "margin_bottom_mm": 10.0,
        "margin_left_mm": 10.0,
        "margin_right_mm": 10.0,
        "dpi": 300,
        "show_cut_lines": True
    }
    zip_req = {
        "file_ids_json": json.dumps([file_id]),
        "layout_json": json.dumps(layout_opts),
        "photo_w_mm": 35.0,
        "photo_h_mm": 45.0,
        "copies_count": 4
    }
    zip_resp = client.post("/api/export/zip", data=zip_req)
    assert zip_resp.status_code == 200
    assert zip_resp.headers["content-type"] == "application/zip"
    assert len(zip_resp.content) > 1000
    assert zip_resp.content.startswith(b"PK")
