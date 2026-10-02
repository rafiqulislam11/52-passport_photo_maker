# Passport Photo Maker Pro 📸
### AI Passport Photo & A4 Print Studio

> **Transform any portrait photo into a biometric, document-compliant passport photo, auto-enhance lighting and skin texture, remove/replace the background, and generate print-ready A4 sheets with multi-page export.**

---

## 🌟 Key Features

1. **Complete Biometric Workflow:**
   - **Upload**: Supports JPG, JPEG, PNG, WEBP up to 50MB with drag-and-drop, device browsing, and clipboard paste (`Ctrl + V`).
   - **AI Face Detection**: Automatically detects primary face, eyes, nose, and mouth using OpenCV and validates head orientation.
   - **ICAO Biometric Auto-Crop**: Enforces international passport standards (head height occupies 70–80% of photo frame, headroom above hair 8–10%, horizontal centering, and shoulder preservation).
   - **AI Background Removal**: Removes original background with `rembg` (u2net ONNX session) or OpenCV GrabCut fallback.
   - **Background Replacement**: Pure White (RGB 255, 255, 255 default), Passport Light Blue (RGB 185, 217, 235), Custom Color with HTML5 color picker, Custom Background Image, or Transparent PNG.
   - **Natural Photo Enhancement**: Auto white balance (Gray World algorithm), subtle bilateral skin smoothing, unsharp masking for hair/eye clarity, exposure correction, and manual fine-tuning sliders (brightness, contrast, sharpness, saturation, exposure).
   - **Presets**: Bangladesh Passport (35×45 mm), Standard ICAO / EU / UK (35×45 mm), US Passport & Visa (2×2 inch / 51×51 mm), Schengen Visa (35×45 mm), 40×50 mm, 45×55 mm, and Custom dimensions with 300 / 600 DPI.
   - **A4 Print Studio**: Auto-calculates grid capacity for A4, A5, and US Letter papers, portrait or landscape, with custom gaps (mm) and margins. Includes an **Auto Fit** button to maximize photo count without clipping.
   - **Multi-Page Handling**: Automatically distributes copies across multiple pages when the count exceeds a single sheet.
   - **Export Formats**: Individual JPG / PNG, high-resolution A4 sheet JPG / PNG, vector-accurate 100% scale A4 PDF (ReportLab), and structured ZIP archives.
   - **True 1:1 Scale Print**: Custom `@media print` CSS ensuring 100% true physical scale without browser margins.
   - **Bilingual Interface**: Seamless instant toggle between English and grammatically authentic বাংলা.

---

## 🏗️ Project Architecture

```
52-passport_photo_maker/
├── backend/
│   ├── app/
│   │   ├── api/          # REST API endpoints (routes.py)
│   │   ├── core/         # Config, security, API auth, cleanup
│   │   ├── models/       # SaaS DB models (ready for PostgreSQL)
│   │   ├── processors/   # End-to-end photo processing pipeline
│   │   ├── schemas/      # Pydantic request and response schemas
│   │   ├── services/     # Face detection, background removal, enhancement, A4 layout, PDF & ZIP
│   │   ├── utils/        # Image conversion helpers and sanitizers
│   │   └── main.py       # FastAPI application & middleware
│   ├── tests/            # Automated test suite (Pytest + TestClient)
│   ├── uploads/          # Temporary safe upload store
│   ├── outputs/          # Processed outputs store
│   ├── temp/             # Ephemeral pipeline cache
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Upload, Settings, Background, Enhancement, Layout, Previews, Modals
│   │   ├── hooks/        # usePassportStudio central state orchestrator
│   │   ├── layouts/      # AppLayout with print styling isolation
│   │   ├── pages/        # StudioPage 2-column responsive layout
│   │   ├── services/     # REST API client
│   │   ├── types/        # TypeScript interfaces
│   │   ├── utils/        # Translations (EN/BN) and presets
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css     # Tailwind CSS + @media print
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14 & 3.11)
- **Node.js 18+** & **npm**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run backend API server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will be available at: `http://127.0.0.1:8000`
Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The React frontend will be accessible at: `http://localhost:5173`

---

## 🐳 Docker Deployment

To launch the full production stack with frontend and backend orchestrated:

```bash
docker compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## 🧪 Running Automated Tests

Run the backend integration test suite:

```bash
cd backend
python -m pytest tests/
```

Test coverage includes:
- ✅ Health check
- ✅ Preset listings (including Bangladesh Passport 35×45 mm)
- ✅ Valid image upload & face detection metadata
- ✅ Malicious / corrupted image rejection
- ✅ Full AI photo processing pipeline
- ✅ A4 layout metrics & raster preview generation
- ✅ Millimeter-accurate vector PDF generation
- ✅ Batch ZIP packaging

---

## 📡 REST API Documentation

### 1. Health Check
- **`GET /api/health`**
- Response:
```json
{
  "status": "healthy",
  "service": "Passport Photo Maker Pro API",
  "version": "2.0.0"
}
```

### 2. Presets
- **`GET /api/presets`**
- Returns all standard international passport and visa specifications.

### 3. Upload Photo
- **`POST /api/upload`**
- Body: `multipart/form-data` with `file: UploadFile`
- Response:
```json
{
  "success": true,
  "message": "Image uploaded and analyzed successfully",
  "data": {
    "file_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "width": 1200,
    "height": 1600,
    "face_info": {
      "detected": true,
      "headroom_pct": 12.5,
      "face_height_pct": 72.0,
      "is_centered": true
    }
  }
}
```

### 4. Process Photo
- **`POST /api/process`**
- Parameters: `file_id`, `options_json` (preset, background, enhancement, DPI, alignment)
- Response:
```json
{
  "success": true,
  "message": "Photo processed successfully",
  "data": {
    "image_url": "data:image/jpeg;base64,...",
    "width_px": 413,
    "height_px": 531,
    "width_mm": 35.0,
    "height_mm": 45.0,
    "dpi": 300,
    "preset": "bangladesh_passport"
  }
}
```

### 5. A4 Preview
- **`POST /api/a4-preview`**
- Parameters: `file_id`, `layout_json`, `photo_w_mm`, `photo_h_mm`, `copies_count`

### 6. Export PDF
- **`POST /api/export/pdf`**
- Generates 100% scale, true physical size PDF using ReportLab with optional cutting guidelines.

### 7. Export ZIP
- **`POST /api/export/zip`**
- Packages individual photos and A4 PDF/preview into a ZIP file.

---

## 🖨️ Printing Instructions

When printing via the browser **Print A4** button:
1. Destination: Choose your color photo printer.
2. Paper Size: **A4 (210 × 297 mm)**.
3. Scale: **100% / Actual Size** (Never choose "Fit to printable area" or "Shrink to fit").
4. Margins: **None**.
5. Recommended paper: **200–260 GSM Glossy or Matte Inkjet Photo Paper**.

---

## 🔒 Security & Performance Features
- File signature / magic-bytes verification (prevents malicious executables disguised as images).
- File size capped at 50 MB (configurable via `MAX_UPLOAD_MB`).
- Strict filename sanitization and path traversal prevention.
- Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`).
- Configurable `X-API-Key` authentication support for SaaS integration.
- Automated temporary file cleanup.
