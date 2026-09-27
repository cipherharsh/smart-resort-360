@echo off
title Smart Resort 360 - Unified Platform
echo ========================================================
echo   SMART RESORT 360 - LAUNCHING UNIFIED APPLICATION
echo ========================================================
cd /d "%~dp0"
if exist backend\venv\Scripts\python.exe (
    backend\venv\Scripts\python.exe run_app.py
) else (
    python run_app.py
)
pause
