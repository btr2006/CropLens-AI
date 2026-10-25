import os
import glob
import requests
import json
import re

test_root = r"c:\3D-WEBSITE-TEMPLATE (1)\datasets\severity\aichallenger\clean\test"

cases = {
    "A_Tomato_EarlyBlight": (glob.glob(os.path.join(test_root, "44", "*.*"))[0], "Tomato"),
    "B_Tomato_TargetSpot": (glob.glob(os.path.join(test_root, "59", "*.*"))[0], "Tomato"),
    "C_Potato_EarlyBlight": (glob.glob(os.path.join(test_root, "32", "*.*"))[0], "Potato"),
    "D_Corn_Rust": (glob.glob(os.path.join(test_root, "15", "*.*"))[0], "Corn"),
    "E_Tomato_Healthy": (glob.glob(os.path.join(test_root, "41", "*.*"))[0], "Tomato"),
}

API_URL = "http://127.0.0.1:8000/predict/crop-health"
STREAM_URL = "http://127.0.0.1:8000/predict/crop-health/stream"

print("================================================================")
print("1. RUNNING AUDIT CASES A THROUGH E")
print("================================================================")

for name, (img_path, crop) in cases.items():
    with open(img_path, "rb") as f:
        resp = requests.post(API_URL, files={"image": ("img.jpg", f, "image/jpeg")}, data={
            "Fertilizer": "75.0", "temp": "26.0", "N": "80.0", "P": "45.0", "K": "40.0", "crop": crop
        })
    d = resp.json()
    print(f"\n--- {name} ---")
    print(f"Crop: {d.get('crop')} | Disease: {d.get('disease')} ({d.get('disease_confidence')}%)")
    print(f"Severity: {d.get('severity')} | Status: {d.get('severity_status')} | Conf: {d.get('severity_confidence')}")
    print(f"Explanation: {d.get('severity_explanation')}")
    print(f"Yield: {d.get('predicted_yield')} t/ha ({d.get('yield_risk')} Risk) | Overall Risk: {d.get('overall_risk')}")
    print(f"Timings: {d.get('timings_ms')}")

print("\n================================================================")
print("2. CASE F: UNSUPPORTED DISEASE/CROP ROUTING")
print("================================================================")
import sys
sys.path.insert(0, r"c:\3D-WEBSITE-TEMPLATE (1)\ml-service")
import main
unsupported_case = main.get_severity_routing("Squash___Powdery_mildew", "Powdery Mildew")
print("Routing result for Squash Powdery Mildew:")
print(json.dumps(unsupported_case, indent=2))

print("\n================================================================")
print("3. CASE G: CROP MISMATCH PROTECTION")
print("================================================================")
tomato_img = glob.glob(os.path.join(test_root, "44", "*.*"))[0]
with open(tomato_img, "rb") as f:
    resp = requests.post(API_URL, files={"image": ("img.jpg", f, "image/jpeg")}, data={
        "Fertilizer": "75.0", "temp": "26.0", "N": "80.0", "P": "45.0", "K": "40.0", "crop": "Strawberry"
    })
mismatch_res = resp.json()
print("Mismatch detected:", mismatch_res.get("crop_mismatch"))
print("Detected:", mismatch_res.get("detected_crop"), "| Selected:", mismatch_res.get("selected_crop"))
print("Downstream Severity included?:", "severity" in mismatch_res and mismatch_res["severity"] is not None)
print("Downstream Yield included?:", "predicted_yield" in mismatch_res and mismatch_res["predicted_yield"] is not None)
print("Downstream Risk included?:", "overall_risk" in mismatch_res and mismatch_res["overall_risk"] is not None)

print("\n================================================================")
print("4. SECURITY & SECRET AUDIT (Exposed Gemini Keys)")
print("================================================================")
key_pattern = re.compile(r"AIzaSy[0-9A-Za-z-_]{33}")
workspace_root = r"c:\3D-WEBSITE-TEMPLATE (1)"
exposed_files = []

for root, dirs, files in os.walk(workspace_root):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".git" in dirs:
        dirs.remove(".git")
    if "kaggle-env" in dirs:
        dirs.remove("kaggle-env")
    if "dist" in dirs:
        dirs.remove("dist")
    if "datasets" in dirs:
        dirs.remove("datasets")

    for file in files:
        if file.endswith((".js", ".jsx", ".ts", ".tsx", ".py", ".json", ".env", ".env.local")):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    matches = key_pattern.findall(content)
                    if matches:
                        exposed_files.append((filepath, len(matches)))
            except Exception:
                pass

if exposed_files:
    print(f"WARNING: Found potential API keys in {len(exposed_files)} files:")
    for path, count in exposed_files:
        print(f"  {path} ({count} matches)")
else:
    print("CLEAN: Zero hardcoded Gemini API keys found in active source code.")
