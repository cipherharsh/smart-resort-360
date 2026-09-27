# run_app.py - Unified Launcher for Smart Resort 360
import os
import sys
import subprocess
import time
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Locate Python executable inside backend venv or fallback to system python
if os.name == "nt":
    python_exe = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
else:
    python_exe = os.path.join(BACKEND_DIR, "venv", "bin", "python")

if not os.path.exists(python_exe):
    python_exe = sys.executable

print("=" * 60)
print("  SMART RESORT 360 - UNIFIED OPERATING PLATFORM")
print("=" * 60)
print(f"[*] Root Directory:     {ROOT_DIR}")
print(f"[*] Backend Directory:  {BACKEND_DIR}")
print(f"[*] Frontend Directory: {FRONTEND_DIR}")
print(f"[*] Python Interpreter: {python_exe}")
print("=" * 60)
print("[*] Starting Backend (FastAPI on http://127.0.0.1:8000)...")

backend_cmd = [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR)

time.sleep(1.5)

print("[*] Starting Frontend (Vite on http://localhost:3000)...")
# Windows npm / npx
frontend_cmd = "npx.cmd vite --port 3000 --host" if os.name == "nt" else "npx vite --port 3000 --host"
frontend_proc = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR, shell=True)

import webbrowser
webbrowser.open("http://localhost:3000")

print("\n" + "=" * 60)
print("  ALL SERVICES RUNNING SUCCESSFULLY!")
print("  - Web Application: http://localhost:3000 (Opened in default browser)")
print("  - Backend API:     http://localhost:8000")
print("  - API Docs:        http://localhost:8000/docs")
print("=" * 60)
print("Press Ctrl+C in this terminal to stop all services.\n")

def cleanup(sig, frame):
    print("\n[*] Shutting down Smart Resort 360 services...")
    try:
        frontend_proc.terminate()
    except Exception:
        pass
    try:
        backend_proc.terminate()
    except Exception:
        pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
if hasattr(signal, "SIGBREAK"):
    signal.signal(signal.SIGBREAK, cleanup)

try:
    while True:
        time.sleep(1)
        if backend_proc.poll() is not None:
            print("[!] Backend exited unexpectedly.")
            break
        if frontend_proc.poll() is not None:
            print("[!] Frontend exited unexpectedly.")
            break
except KeyboardInterrupt:
    cleanup(None, None)
