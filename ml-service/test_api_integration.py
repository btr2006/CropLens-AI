import os
import sys
import json
import time
from fastapi.testclient import TestClient
from PIL import Image
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import app

def run_integration_tests():
    print("=== FASTAPI MULTI-CROP SEVERITY MODEL INTEGRATION TEST ===")
    
    with TestClient(app) as client:
        # 1. Test /health
        print("\n--- 1. Testing GET /health ---")
        health_resp = client.get("/health")
        print("Status Code:", health_resp.status_code)
        health_data = health_resp.json()
        print("Health Response:", json.dumps(health_data, indent=2))
        assert health_resp.status_code == 200
        assert health_data["disease_model_loaded"] is True
        assert health_data["severity_model_loaded"] is True
        assert health_data["yield_model_loaded"] is True

        # 2. Test /predict/yield regression
        print("\n--- 2. Testing POST /predict/yield Regression ---")
        yield_payload = {
            "Fertilizer": 120.0,
            "temp": 26.5,
            "N": 80.0,
            "P": 45.0,
            "K": 40.0
        }
        yield_resp = client.post("/predict/yield", json=yield_payload)
        print("Status Code:", yield_resp.status_code)
        yield_data = yield_resp.json()
        print("Yield Response:", json.dumps(yield_data, indent=2))
        assert yield_resp.status_code == 200
        assert "predicted_yield" in yield_data
        assert yield_data["predicted_yield"] > 0

        # Find sample images for the 6 test cases
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        clean_test_dir = os.path.join(base_dir, "datasets", "severity", "aichallenger", "clean", "test")
        disease_dir = os.path.join(base_dir, "datasets", "disease")

        # Helpers to locate an image file
        def find_image_in_dir(folder_path):
            if os.path.exists(folder_path):
                for f in os.listdir(folder_path):
                    if f.lower().endswith((".jpg", ".jpeg", ".png")):
                        return os.path.join(folder_path, f)
            return None

        # Test Case 1: Tomato Early Blight (AIC ID 44 or 45)
        img_t1 = find_image_in_dir(os.path.join(clean_test_dir, "44")) or find_image_in_dir(os.path.join(disease_dir, "Tomato___Early_blight"))
        # Test Case 2: Tomato Late Blight (AIC ID 49 or 50)
        img_t2 = find_image_in_dir(os.path.join(clean_test_dir, "49")) or find_image_in_dir(os.path.join(disease_dir, "Tomato___Late_blight"))
        # Test Case 3: Potato Early Blight (AIC ID 32 or 33)
        img_t3 = find_image_in_dir(os.path.join(clean_test_dir, "33")) or find_image_in_dir(os.path.join(disease_dir, "Potato___Early_blight"))
        # Test Case 4: Tomato Target Spot (AIC ID 59)
        img_t4 = find_image_in_dir(os.path.join(clean_test_dir, "59")) or find_image_in_dir(os.path.join(disease_dir, "Tomato___Target_Spot"))
        # Test Case 5: Blueberry Healthy
        img_t5 = find_image_in_dir(os.path.join(disease_dir, "Blueberry___healthy"))
        if not img_t5:
            # Create a green test leaf image if dataset folder missing
            img_t5 = os.path.join(base_dir, "ml-service", "models", "temp_healthy_leaf.jpg")
            Image.new("RGB", (224, 224), color=(34, 139, 34)).save(img_t5)
        # Test Case 6: Squash Powdery Mildew / Apple Black Rot (Unsupported)
        img_t6 = find_image_in_dir(os.path.join(disease_dir, "Squash___Powdery_mildew")) or find_image_in_dir(os.path.join(disease_dir, "Apple___Black_rot"))

        test_cases = [
            ("TEST 1: Tomato Early Blight", img_t1, "Tomato", "Early Blight", ["Mild", "Severe"], True, "graded"),
            ("TEST 2: Tomato Late Blight", img_t2, "Tomato", "Late Blight", ["Mild", "Severe"], True, "graded"),
            ("TEST 3: Potato Early Blight", img_t3, "Potato", "Early Blight", ["Mild", "Severe"], True, "graded"),
            ("TEST 4: Tomato Target Spot", img_t4, "Tomato", "Target Spot", ["General / Single-stage"], False, "not_explicitly_graded"),
            ("TEST 5: Healthy Crop", img_t5, None, "Healthy", ["Healthy"], False, "healthy"),
            ("TEST 6: Unsupported Disease", img_t6, None, None, [None, "Unavailable"], False, "unavailable")
        ]

        print("\n--- 3. Running All 6 Crop-Health Pipeline Test Cases ---")
        for test_name, img_path, exp_crop, exp_disease, exp_sev_list, exp_supported, exp_status in test_cases:
            print(f"\n==================================================")
            print(f"Executing {test_name}")
            print(f"Image Source: {img_path}")
            
            if not img_path or not os.path.exists(img_path):
                print(f"[SKIP] Sample image not found at {img_path}")
                continue

            with open(img_path, "rb") as f:
                file_bytes = f.read()

            files = {"image": ("test_leaf.jpg", file_bytes, "image/jpeg")}
            data = {
                "Fertilizer": "120.0",
                "temp": "25.0",
                "N": "75.0",
                "P": "40.0",
                "K": "45.0",
                "crop": "auto-detect"
            }

            resp = client.post("/predict/crop-health", files=files, data=data)
            print(f"HTTP Status: {resp.status_code}")
            res = resp.json()

            print(f"Predicted Crop:      {res.get('predicted_crop')}")
            print(f"Diagnosed Disease:   {res.get('disease')} ({res.get('disease_confidence')}%)")
            print(f"Severity Output:     {res.get('severity')}")
            print(f"Severity Confidence: {res.get('severity_confidence')}%")
            print(f"Severity Supported:  {res.get('severity_model_supported')}")
            print(f"Severity Status:     {res.get('severity_status')}")
            print(f"Severity Explanation:{res.get('severity_explanation')}")
            print(f"Overall Risk:        {res.get('overall_risk')}")
            print(f"Timings (ms):        {json.dumps(res.get('timings_ms'))}")

            # Assertions
            assert resp.status_code == 200
            assert "predicted_crop" in res
            assert "disease" in res
            assert "overall_risk" in res
            assert "timings_ms" in res
            assert "disease_inference_ms" in res["timings_ms"]
            assert "severity_inference_ms" in res["timings_ms"]

            if exp_status == "graded":
                assert res.get("severity") in ["Mild", "Severe"], f"Expected Mild/Severe, got {res.get('severity')}"
                assert res.get("severity_model_supported") is True
                assert res.get("severity_confidence") is not None
            elif exp_status == "not_explicitly_graded":
                assert res.get("severity") == "General / Single-stage"
                assert res.get("severity_model_supported") is False
            elif exp_status == "healthy":
                assert res.get("severity") == "Healthy"
            elif exp_status == "unavailable":
                assert res.get("severity_model_supported") is False

        print("\n==================================================")
        print("ALL FASTAPI INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("==================================================")

if __name__ == "__main__":
    run_integration_tests()
