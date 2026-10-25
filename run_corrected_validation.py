import os
import glob
import requests
import json
import time

test_root = r"c:\3D-WEBSITE-TEMPLATE (1)\datasets\severity\aichallenger\clean\test"

# Exact verified mapping
test_definitions = [
    {
        "test_num": 1,
        "class_id": "44",
        "ground_truth_crop": "Tomato",
        "ground_truth_disease": "Early Blight",
        "ground_truth_severity": "Mild",
        "category_type": "Explicitly Graded"
    },
    {
        "test_num": 2,
        "class_id": "45",
        "ground_truth_crop": "Tomato",
        "ground_truth_disease": "Early Blight",
        "ground_truth_severity": "Severe",
        "category_type": "Explicitly Graded"
    },
    {
        "test_num": 3,
        "class_id": "59",
        "ground_truth_crop": "Tomato",
        "ground_truth_disease": "Target Spot",
        "ground_truth_severity": "General / Single-stage",
        "category_type": "Single-stage"
    },
    {
        "test_num": 4,
        "class_id": "32",
        "ground_truth_crop": "Potato",
        "ground_truth_disease": "Early Blight",
        "ground_truth_severity": "Mild",
        "category_type": "Explicitly Graded"
    },
    {
        "test_num": 5,
        "class_id": "33",
        "ground_truth_crop": "Potato",
        "ground_truth_disease": "Early Blight",
        "ground_truth_severity": "Severe",
        "category_type": "Explicitly Graded"
    },
    {
        "test_num": 6,
        "class_id": "15",
        "ground_truth_crop": "Corn",
        "ground_truth_disease": "Rust",
        "ground_truth_severity": "Mild",
        "category_type": "Explicitly Graded"
    },
    {
        "test_num": 7,
        "class_id": "16",
        "ground_truth_crop": "Corn",
        "ground_truth_disease": "Rust",
        "ground_truth_severity": "Severe",
        "category_type": "Explicitly Graded"
    },
    {
        "test_num": 8,
        "class_id": "48",
        "ground_truth_crop": "Tomato",
        "ground_truth_disease": "Healthy",
        "ground_truth_severity": "Healthy / not required",
        "category_type": "Healthy"
    }
]

API_URL = "http://127.0.0.1:8000/predict/crop-health"

print("================================================================================")
print("RUNNING CORRECTED 8-CASE VALIDATION PASS")
print("================================================================================")

results = []

for item in test_definitions:
    cid = item["class_id"]
    class_dir = os.path.join(test_root, cid)
    imgs = glob.glob(os.path.join(class_dir, "*.*"))
    if not imgs:
        print(f"Error: No images found in {class_dir}")
        continue

    img_path = imgs[0]
    filename = os.path.basename(img_path)

    # Post with auto-detect (crop=None) so we see raw Stage 1 disease model behavior
    with open(img_path, "rb") as f:
        resp = requests.post(
            API_URL,
            files={"image": (filename, f, "image/jpeg")},
            data={"Fertilizer": "75.0", "temp": "26.0", "N": "80.0", "P": "45.0", "K": "40.0"}
        )

    res_json = resp.json()

    pred_crop = res_json.get("crop")
    pred_disease = res_json.get("disease")
    disease_conf = res_json.get("disease_confidence")
    pred_sev = res_json.get("severity")
    sev_status = res_json.get("severity_status")
    sev_conf = res_json.get("severity_confidence")
    pred_yield = res_json.get("predicted_yield")
    overall_risk = res_json.get("overall_risk")
    timings = res_json.get("timings_ms", {})

    record = {
        "test_num": item["test_num"],
        "class_id": cid,
        "image_file": filename,
        "gt_crop": item["ground_truth_crop"],
        "gt_disease": item["ground_truth_disease"],
        "gt_severity": item["ground_truth_severity"],
        "pred_crop": pred_crop,
        "pred_disease": pred_disease,
        "disease_conf": disease_conf,
        "pred_severity": pred_sev,
        "severity_status": sev_status,
        "severity_conf": sev_conf,
        "yield": pred_yield,
        "overall_risk": overall_risk,
        "timings": timings
    }
    results.append(record)

    print(f"\nTEST {item['test_num']}: AI Challenger Class {cid} ({item['ground_truth_crop']} {item['ground_truth_disease']} - {item['ground_truth_severity']})")
    print(f"  File: {filename}")
    print(f"  Stage 1 Prediction : {pred_crop} — {pred_disease} (Confidence: {disease_conf}%)")
    print(f"  Stage 2 Severity   : {pred_sev} (Status: {sev_status}, Confidence: {sev_conf}%)")
    print(f"  Stage 3 Yield/Risk : Yield = {pred_yield} t/ha | Overall Risk = {overall_risk}")
    print(f"  Timings (ms)       : Disease = {timings.get('disease_inference_ms')} ms | Severity = {timings.get('severity_inference_ms')} ms | Yield = {timings.get('yield_inference_ms')} ms")

    # Mismatch check:
    crop_match = (str(pred_crop).lower() == item['ground_truth_crop'].lower())
    disease_match = (item['ground_truth_disease'].lower() in str(pred_disease).lower())
    if not crop_match or not disease_match:
        print(f"  * Pipeline Observation: Ground truth [{item['ground_truth_crop']} {item['ground_truth_disease']}] was classified as [{pred_crop} {pred_disease}] by Stage 1 CNN.")

with open("corrected_validation_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
