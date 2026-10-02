import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
TEMP_DIR = BASE_DIR / "temp"

for directory in (UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR):
    directory.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "Passport Photo Maker Pro API"
    app_version: str = "2.0.0"
    app_env: str = os.getenv("APP_ENV", "development")
    api_key_enabled: bool = os.getenv("API_KEY_ENABLED", "false").lower() == "true"
    app_api_key: str = os.getenv("APP_API_KEY", "change-this-key")
    remove_bg_api_key: str = os.getenv("REMOVE_BG_API_KEY", "")
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "50"))
    default_dpi: int = int(os.getenv("DEFAULT_DPI", "300"))
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    upload_dir: Path = UPLOAD_DIR
    output_dir: Path = OUTPUT_DIR
    temp_dir: Path = TEMP_DIR

settings = Settings()
