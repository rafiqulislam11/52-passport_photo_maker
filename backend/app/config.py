import os
from dataclasses import dataclass

@dataclass
class Settings:
    app_name: str = os.getenv("APP_NAME", "Passport Photo Maker API")
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "15"))
    enable_rembg: bool = os.getenv("ENABLE_REMBG", "true").lower() == "true"
    default_dpi: int = int(os.getenv("DEFAULT_DPI", "300"))

settings = Settings()
