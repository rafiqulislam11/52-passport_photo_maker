@echo off
title Passport Photo Maker Pro Launcher
echo ========================================================
echo       Passport Photo Maker Pro - AI Studio
echo ========================================================
echo.

if not exist "frontend\dist\index.html" (
    echo [SETUP] Frontend dist not found. Building frontend assets...
    call npm.cmd run build --prefix frontend
    echo.
)

netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend server is already running on port 8000!
) else (
    echo [STARTING] Launching Python FastAPI Backend Server...
    start /min "" python -m uvicorn app.main:app --app-dir backend --port 8000
    timeout /t 3 /nobreak >nul
)

echo [OPENING] Launching web app in your default browser...
start http://localhost:8000

echo.
echo App is ready at: http://localhost:8000
echo You can keep this window closed or minimize it.
timeout /t 2 >nul
exit
