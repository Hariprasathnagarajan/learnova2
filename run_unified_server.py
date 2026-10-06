#!/usr/bin/env python
"""
Learnova Unified Production Server Launcher
Serves both the compiled React Native Web Frontend and Django REST Framework API on port 8000.
"""
import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / 'backend'
DIST_DIR = BASE_DIR / 'dist'

def main():
    print("=" * 60)
    print("  [*] LEANOVA UNIFIED PRODUCTION SERVER (WEB + MOBILE API)")
    print("=" * 60)
    
    # 1. Verify web bundle exists
    if not (DIST_DIR / 'index.html').exists():
        print("[*] Web bundle dist/index.html not present; API endpoints and Django Admin are active.")
    else:
        print("[OK] Web bundle verified in:", DIST_DIR)

    # 2. Set environment
    try:
        from dotenv import load_dotenv
        load_dotenv(BACKEND_DIR / '.env')
    except ImportError:
        pass
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnova_server.settings')
    
    # 3. Apply migrations and sync MongoDB
    print("[*] Checking database migrations...")
    subprocess.run([sys.executable, "manage.py", "migrate"], cwd=str(BACKEND_DIR), check=True)
    print("[*] Synchronizing data to MongoDB...")
    subprocess.run([sys.executable, "manage.py", "sync_mongodb"], cwd=str(BACKEND_DIR))

    print("\n" + "=" * 60)
    print("  [WEB] Web Application:  http://localhost:8000/  (LAN: http://10.43.229.186:8000/)")
    print("  [API] REST API Base:    http://localhost:8000/api/v1/  (LAN: http://10.43.229.186:8000/api/v1/)")
    print("  [ADM] Django Admin:     http://localhost:8000/admin/")
    print("  [APK] APK Direct URL:   http://10.43.229.186:8000/download/app-debug.apk")
    print("  [DIR] APK Local Path:   android/app/build/outputs/apk/debug/app-debug.apk")
    print("=" * 60)
    print("\nStarting Django server on 0.0.0.0:8000 (press Ctrl+C to stop)...")
    
    # Run server
    subprocess.run([sys.executable, "manage.py", "runserver", "0.0.0.0:8000"], cwd=str(BACKEND_DIR))

if __name__ == '__main__':
    main()
