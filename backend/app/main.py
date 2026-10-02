import time
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings, BASE_DIR
from .core.security import cleanup_temp_files
from .api.routes import router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: periodic cleanup of old temporary files
    cleanup_temp_files(max_age_seconds=86400)
    yield
    # Shutdown

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI Passport Photo & A4 Print Studio — Professional passport photo processing, background removal, auto framing, and print-ready A4 sheet generation API.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Include API routes
app.include_router(router)

# Mount outputs for static file serving
app.mount("/outputs", StaticFiles(directory=str(settings.output_dir)), name="outputs")

# Mount frontend dist static files if built
frontend_dist = BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

    @app.exception_handler(404)
    async def spa_404_fallback(request: Request, exc):
        path = request.url.path
        if not path.startswith("/api") and not path.startswith("/outputs") and not path.startswith("/docs"):
            index_path = frontend_dist / "index.html"
            if index_path.exists():
                return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"detail": "Not Found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
