import os
import sys
import shutil
import zipfile
import subprocess
from pathlib import Path

BASE_DIR = Path(r"D:\Hariprasath\learnova")
ANDROID_DIR = BASE_DIR / "android"
APP_DIR = ANDROID_DIR / "app"
ORIGINAL_APK = APP_DIR / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
NEW_BUNDLE = APP_DIR / "src" / "main" / "assets" / "index.android.bundle"
KEYSTORE = APP_DIR / "debug.keystore"

BUILD_TOOLS_DIR = Path(r"C:\Users\sago\AppData\Local\Android\Sdk\build-tools\35.0.0")
ZIPALIGN = BUILD_TOOLS_DIR / "zipalign.exe"
APKSIGNER = BUILD_TOOLS_DIR / "apksigner.bat"

TEMP_DIR = BASE_DIR / "temp_apk_build"
UNSIGNED_APK = TEMP_DIR / "app-debug-unsigned.apk"
ALIGNED_APK = TEMP_DIR / "app-debug-aligned.apk"
FINAL_APK = ORIGINAL_APK

def main():
    print("=== Learnova Standalone APK Repackager & Signer ===")
    if not ORIGINAL_APK.exists():
        print(f"Error: Original APK not found at {ORIGINAL_APK}")
        sys.exit(1)
    if not NEW_BUNDLE.exists():
        print(f"Error: Compiled Hermes bundle not found at {NEW_BUNDLE}")
        sys.exit(1)
        
    print(f"Bundle size: {NEW_BUNDLE.stat().st_size} bytes")
    
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    TEMP_DIR.mkdir(parents=True)
    
    # 1. Repackage APK with updated index.android.bundle and strip old signatures
    print("1. Injecting new Hermes bundle into APK and stripping old signatures...")
    with zipfile.ZipFile(ORIGINAL_APK, 'r') as zin, zipfile.ZipFile(UNSIGNED_APK, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            # Skip old META-INF signatures
            if item.filename.startswith("META-INF/") and (
                item.filename.endswith(".SF") or 
                item.filename.endswith(".RSA") or 
                item.filename.endswith(".DSA") or 
                item.filename.endswith(".MF")
            ):
                continue
            
            # Skip old index.android.bundle
            if item.filename == "assets/index.android.bundle":
                continue
            
            # Copy all other files (native libs, resources, manifests, dex, fonts)
            data = zin.read(item.filename)
            zout.writestr(item, data)
            
        # Add new compiled bundle
        with open(NEW_BUNDLE, 'rb') as f:
            bundle_data = f.read()
        zout.writestr("assets/index.android.bundle", bundle_data)
        
    print(f"Unsigned APK created: {UNSIGNED_APK.stat().st_size} bytes")
    
    # 2. Zipalign (4-byte alignment required by Android)
    print("2. Running zipalign...")
    align_cmd = [str(ZIPALIGN), "-p", "-f", "-v", "4", str(UNSIGNED_APK), str(ALIGNED_APK)]
    res = subprocess.run(align_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Zipalign failed:", res.stderr)
        sys.exit(1)
    print("Zipalign successful.")
    
    # 3. Sign APK with debug keystore using apksigner
    print("3. Signing APK with apksigner (v1, v2, v3 schemes)...")
    sign_cmd = [
        str(APKSIGNER), "sign",
        "--ks", str(KEYSTORE),
        "--ks-pass", "pass:android",
        "--key-pass", "pass:android",
        "--ks-key-alias", "androiddebugkey",
        "--out", str(FINAL_APK),
        str(ALIGNED_APK)
    ]
    res = subprocess.run(sign_cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print("Apksigner sign failed:", res.stderr, res.stdout)
        sys.exit(1)
    print("Apksigner signing successful.")
    
    # 4. Verify APK signature
    print("4. Verifying APK signature...")
    verify_cmd = [str(APKSIGNER), "verify", "--verbose", str(FINAL_APK)]
    res = subprocess.run(verify_cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print("Apksigner verify failed:", res.stderr, res.stdout)
        sys.exit(1)
    print("Signature verification output:")
    print(res.stdout)
    
    # Cleanup temp
    shutil.rmtree(TEMP_DIR)
    print(f"[OK] Final Production APK ready at: {FINAL_APK}")
    print(f"File size: {FINAL_APK.stat().st_size / (1024*1024):.2f} MB")

if __name__ == "__main__":
    main()
