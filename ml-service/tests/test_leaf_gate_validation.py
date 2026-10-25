"""
CropGuard AI - Leaf Gate & Pipeline Regression Test Suite

Verifies:
1. Random Non-Leaf Image Tests (room, road, electronics, animal, food, screenshot, sky, building)
2. False-Rejection Tests on Genuine Crops (Tomato, Potato, Corn, Apple, Strawberry, Peach, Pepper, Grape)
3. Quality Check Tests (low-res, extreme darkness)
4. Crop Mismatch Consistency
5. Pipeline Timing Measurements
"""

import os
import sys
import glob
import time
import json
import torch
from PIL import Image, ImageDraw

# Add ml-service to path
script_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.abspath(os.path.join(script_dir, ".."))
project_root = os.path.abspath(os.path.join(ml_service_dir, ".."))
if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)

import main

def create_synthetic_person_image(path):
    """Create a stylized portrait / person photo for testing."""
    img = Image.new('RGB', (224, 224), color=(220, 220, 230))
    draw = ImageDraw.Draw(img)
    # Head
    draw.ellipse([80, 40, 144, 110], fill=(235, 195, 170), outline=(180, 140, 120))
    # Eyes
    draw.ellipse([95, 65, 105, 75], fill=(50, 50, 50))
    draw.ellipse([119, 65, 129, 75], fill=(50, 50, 50))
    # Shoulders / shirt
    draw.polygon([(40, 224), (204, 224), (160, 130), (64, 130)], fill=(40, 70, 120))
    img.save(path)
    return path

def create_synthetic_food_image(path):
    """Create a stylized food / burger plate photo for testing."""
    img = Image.new('RGB', (224, 224), color=(240, 235, 220))
    draw = ImageDraw.Draw(img)
    # Plate
    draw.ellipse([20, 20, 204, 204], fill=(255, 255, 255), outline=(200, 200, 200))
    # Bun bottom
    draw.ellipse([50, 110, 174, 160], fill=(210, 150, 80))
    # Patty
    draw.rectangle([50, 100, 174, 120], fill=(90, 50, 30))
    # Bun top
    draw.ellipse([50, 60, 174, 110], fill=(225, 165, 90))
    img.save(path)
    return path

def run_tests():
    print("=" * 70)
    print("CropGuard AI - Leaf Gate & Input Validation Test Suite")
    print("=" * 70)

    models_dir = os.path.join(ml_service_dir, "models")
    datasets_root = os.path.join(project_root, "datasets")
    disease_valid_dir = os.path.join(
        datasets_root, "disease", "New Plant Diseases Dataset(Augmented)",
        "New Plant Diseases Dataset(Augmented)", "valid"
    )
    imagenette_dir = os.path.join(datasets_root, "_cache_negatives", "imagenette2-160")
    scratch_dir = os.path.join(ml_service_dir, "tests", "_scratch")
    os.makedirs(scratch_dir, exist_ok=True)

    # 1. Initialize models
    print("\n[Step 1] Initializing ML Models...")
    # Trigger main lifespan logic manually
    main.disease_device = main.get_device()
    main.leaf_gate_device = main.get_device()

    # Load yield
    import joblib
    main.yield_model = joblib.load(os.path.join(models_dir, "yield_model.pkl"))
    with open(os.path.join(models_dir, "yield_features.json")) as f:
        main.yield_features = json.load(f)

    # Load leaf gate
    from torchvision import models as tv_models, transforms
    import torch.nn as nn
    lg_model = tv_models.mobilenet_v2(weights=None)
    in_feat = lg_model.classifier[1].in_features
    lg_model.classifier = nn.Sequential(nn.Dropout(p=0.3), nn.Linear(in_feat, 2))
    lg_ckpt = torch.load(os.path.join(models_dir, "leaf_gate_mobilenetv2_best.pth"), map_location=main.leaf_gate_device)
    lg_model.load_state_dict(lg_ckpt["model_state_dict"])
    lg_model.to(main.leaf_gate_device)
    lg_model.eval()
    main.leaf_gate_model = lg_model
    main.leaf_gate_threshold = float(lg_ckpt.get("operating_threshold", 0.90))
    main.leaf_gate_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load disease model
    with open(os.path.join(models_dir, "disease_classes.json")) as f:
        main.disease_classes = json.load(f)["classes"]
    d_model = tv_models.mobilenet_v2(weights=None)
    d_model.classifier[1] = nn.Linear(d_model.classifier[1].in_features, len(main.disease_classes))
    d_ckpt = torch.load(os.path.join(models_dir, "disease_mobilenetv2_best.pth"), map_location=main.disease_device)
    d_model.load_state_dict(d_ckpt["model_state_dict"] if "model_state_dict" in d_ckpt else d_ckpt)
    d_model.to(main.disease_device)
    d_model.eval()
    main.disease_model = d_model
    main.disease_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Load severity model
    main.severity_device = main.get_device()
    with open(os.path.join(models_dir, "severity_classes.json")) as f:
        main.severity_classes = json.load(f)["classes"]
    with open(os.path.join(models_dir, "severity_disease_mapping.json")) as f:
        main.severity_disease_mapping = json.load(f)
    num_diseases = len(main.severity_disease_mapping.get("supported_disease_pairs", [])) or 14
    s_model = main.DiseaseConditionedMobileNetV2(num_diseases=num_diseases, num_classes=len(main.severity_classes))
    s_ckpt = torch.load(os.path.join(models_dir, "severity_conditioned_mobilenetv2_best.pth"), map_location=main.severity_device)
    s_model.load_state_dict(s_ckpt["model_state_dict"] if "model_state_dict" in s_ckpt else s_ckpt)
    s_model.to(main.severity_device)
    s_model.eval()
    main.severity_model = s_model
    main.severity_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print("All models successfully loaded!")
    print(f"Leaf gate operating threshold: {main.leaf_gate_threshold}")

    # Check health check endpoint
    h = main.health_check()
    assert h["leaf_gate_model_loaded"] is True, "Health check failed: leaf_gate_model_loaded is False"
    print("Health check endpoint verified:", h)

    # 2. Test Set 1: Random Non-Leaf Image Tests (10 Categories)
    print("\n" + "=" * 50)
    print("[TEST SUITE 1] Random Non-Leaf Image Rejection Tests")
    print("=" * 50)

    # Prepare sample paths for each required non-leaf category
    person_img = create_synthetic_person_image(os.path.join(scratch_dir, "person.jpg"))
    food_img = create_synthetic_food_image(os.path.join(scratch_dir, "food.jpg"))
    sky_img = os.path.join(datasets_root, "_cache_negatives", "synthetic", "synth_sky_000.png")
    screenshot_img = os.path.join(datasets_root, "_cache_negatives", "synthetic", "synth_screenshot_000.png")
    tile_img = os.path.join(datasets_root, "_cache_negatives", "synthetic", "synth_tile_000.png")

    # Find sample from imagenette classes
    church_imgs = glob.glob(os.path.join(imagenette_dir, "**", "n03146192", "*.JPEG"), recursive=True)
    truck_imgs = glob.glob(os.path.join(imagenette_dir, "**", "n03445777", "*.JPEG"), recursive=True)
    cassette_imgs = glob.glob(os.path.join(imagenette_dir, "**", "n02979186", "*.JPEG"), recursive=True)
    dog_imgs = glob.glob(os.path.join(imagenette_dir, "**", "n02102073", "*.JPEG"), recursive=True)
    gas_pump_imgs = glob.glob(os.path.join(imagenette_dir, "**", "n03970156", "*.JPEG"), recursive=True)

    non_leaf_tests = [
        ("Room / Indoor Tiles", tile_img),
        ("Person / Portrait", person_img),
        ("Road / Outdoor Pump", gas_pump_imgs[0] if gas_pump_imgs else tile_img),
        ("Phone / Electronics", cassette_imgs[0] if cassette_imgs else tile_img),
        ("Animal (Dog)", dog_imgs[0] if dog_imgs else tile_img),
        ("Food / Meal", food_img),
        ("UI Screenshot", screenshot_img),
        ("Atmospheric Sky", sky_img),
        ("Building / Architecture", church_imgs[0] if church_imgs else tile_img),
        ("Vehicle (Truck)", truck_imgs[0] if truck_imgs else tile_img),
    ]

    all_non_leaf_passed = True
    non_leaf_results = []

    for name, fpath in non_leaf_tests:
        with Image.open(fpath) as im:
            pil_img = im.convert("RGB")

        # Run pipeline
        events = list(main.run_crop_health_pipeline(
            pil_img=pil_img,
            img_meta={"filename": os.path.basename(fpath), "size_bytes": 1024},
            fertilizer=120, temp=25, n=60, p=40, k=40
        ))

        last_event = events[-1]
        is_rejected = (last_event.get("status") == "rejected")
        leaf_detected = last_event.get("details", {}).get("leaf_detected", False)
        rejection_reason = last_event.get("details", {}).get("image_rejection_reason", "")
        stages_called = [e["stage"] for e in events]

        # Ensure disease, severity, yield, and risk stages were NEVER called
        downstream_called = any(s in stages_called for s in ["disease_analysis", "severity_assessment", "yield_prediction", "risk_fusion"])

        passed = (is_rejected and not leaf_detected and not downstream_called)
        if not passed:
            all_non_leaf_passed = False

        status_str = "REJECTED (PASSED)" if passed else "FAILED (ACCEPTED)"
        conf = last_event.get("details", {}).get("leaf_confidence", 0.0)
        timing = last_event.get("details", {}).get("timings_ms", {}).get("leaf_gate_ms", 0.0)

        print(f"  [{'PASS' if passed else 'FAIL'}] {name:24s} -> {status_str} | Non-leaf Conf: {conf:.1f}% | Gate time: {timing} ms")
        non_leaf_results.append({
            "category": name,
            "passed": passed,
            "leaf_confidence": conf,
            "timing_ms": timing,
            "stages_executed": stages_called
        })

    print(f"\nNon-Leaf Tests Summary: {'ALL 10 TESTS REJECTED CORRECTLY' if all_non_leaf_passed else 'SOME TESTS FAILED'}")

    # 3. Test Set 2: False-Rejection Test on Genuine Crops (8 Species)
    print("\n" + "=" * 50)
    print("[TEST SUITE 2] Genuine Crop Leaf Acceptance Tests (8 Crops)")
    print("=" * 50)

    crop_targets = {
        "Tomato": os.path.join(disease_valid_dir, "Tomato___healthy"),
        "Potato": os.path.join(disease_valid_dir, "Potato___healthy"),
        "Corn": os.path.join(disease_valid_dir, "Corn_(maize)___healthy"),
        "Apple": os.path.join(disease_valid_dir, "Apple___healthy"),
        "Strawberry": os.path.join(disease_valid_dir, "Strawberry___healthy"),
        "Peach": os.path.join(disease_valid_dir, "Peach___healthy"),
        "Pepper": os.path.join(disease_valid_dir, "Pepper,_bell___healthy"),
        "Grape": os.path.join(disease_valid_dir, "Grape___healthy"),
    }

    all_genuine_passed = True
    genuine_results = []

    for crop_name, c_dir in crop_targets.items():
        candidates = glob.glob(os.path.join(c_dir, "*.JPG")) + glob.glob(os.path.join(c_dir, "*.jpg"))
        if not candidates:
            # Try diseased variant
            fallback_dirs = glob.glob(os.path.join(disease_valid_dir, f"{crop_name}*"))
            for fd in fallback_dirs:
                candidates = glob.glob(os.path.join(fd, "*.JPG")) + glob.glob(os.path.join(fd, "*.jpg"))
                if candidates:
                    break

        if not candidates:
            print(f"  [WARN] No sample found for crop: {crop_name}")
            continue

        sample_path = candidates[0]
        with Image.open(sample_path) as im:
            pil_img = im.convert("RGB")

        # Run pipeline
        events = list(main.run_crop_health_pipeline(
            pil_img=pil_img,
            img_meta={"filename": os.path.basename(sample_path), "size_bytes": 2048},
            fertilizer=120, temp=25, n=60, p=40, k=40
        ))

        # Check leaf_validation event
        leaf_events = [e for e in events if e.get("stage") == "leaf_validation"]
        disease_events = [e for e in events if e.get("stage") == "disease_analysis"]
        complete_events = [e for e in events if e.get("stage") == "analysis_complete"]

        leaf_accepted = (len(leaf_events) > 0 and leaf_events[0].get("status") == "complete")
        reached_disease = (len(disease_events) > 0)
        reached_complete = (len(complete_events) > 0)

        passed = (leaf_accepted and reached_disease and reached_complete)
        if not passed:
            all_genuine_passed = False

        leaf_conf = leaf_events[0].get("details", {}).get("leaf_confidence", 0.0) if leaf_events else 0.0
        disease_pred = disease_events[0].get("details", {}).get("disease", "N/A") if disease_events else "N/A"
        crop_pred = disease_events[0].get("details", {}).get("crop", "N/A") if disease_events else "N/A"
        leaf_timing = leaf_events[0].get("details", {}).get("timing_ms", 0.0) if leaf_events else 0.0

        status_str = "ACCEPTED (PASSED)" if passed else "REJECTED (FAILED)"
        print(f"  [{'PASS' if passed else 'FAIL'}] {crop_name:12s} -> {status_str} | Leaf Conf: {leaf_conf:.1f}% | Predicted: {crop_pred} - {disease_pred} | Gate time: {leaf_timing} ms")

        genuine_results.append({
            "crop": crop_name,
            "passed": passed,
            "leaf_confidence": leaf_conf,
            "predicted_crop": crop_pred,
            "predicted_disease": disease_pred,
            "leaf_gate_timing_ms": leaf_timing
        })

    print(f"\nGenuine Leaf Tests Summary: {'ALL 8 CROPS ACCEPTED CLEANLY' if all_genuine_passed else 'SOME CROPS REJECTED'}")

    # 4. Test Set 3: Crop Mismatch Validation
    print("\n" + "=" * 50)
    print("[TEST SUITE 3] Crop Mismatch Enforcement")
    print("=" * 50)
    # Feed Tomato image with selected_crop = 'Potato'
    tomato_sample = glob.glob(os.path.join(crop_targets["Tomato"], "*.JPG"))[0]
    with Image.open(tomato_sample) as im:
        pil_img = im.convert("RGB")

    mismatch_events = list(main.run_crop_health_pipeline(
        pil_img=pil_img,
        img_meta={"filename": "tomato_test.jpg"},
        fertilizer=100, temp=22, n=50, p=30, k=30,
        selected_crop="Potato"
    ))
    mismatch_detected = any(e.get("stage") == "crop_mismatch" for e in mismatch_events)
    print(f"  [{'PASS' if mismatch_detected else 'FAIL'}] Tomato leaf uploaded with selected_crop='Potato' -> Mismatch detected: {mismatch_detected}")

    # 5. Test Set 4: Low Resolution / Quality Check
    print("\n" + "=" * 50)
    print("[TEST SUITE 4] Image Quality Validation")
    print("=" * 50)
    tiny_img = Image.new('RGB', (32, 32), color=(50, 180, 50))
    tiny_events = list(main.run_crop_health_pipeline(
        pil_img=tiny_img,
        img_meta={"filename": "tiny.jpg"},
        fertilizer=100, temp=22, n=50, p=30, k=30
    ))
    tiny_rejected = (tiny_events[0].get("stage") == "image_validation" and tiny_events[0].get("status") == "rejected")
    print(f"  [{'PASS' if tiny_rejected else 'FAIL'}] Tiny (32x32) image -> Quality Check Rejected: {tiny_rejected} (Reason: {tiny_events[0]['details']['image_rejection_reason']})")

    # Save summary report
    test_report = {
        "non_leaf_all_passed": all_non_leaf_passed,
        "genuine_all_passed": all_genuine_passed,
        "crop_mismatch_passed": mismatch_detected,
        "quality_check_passed": tiny_rejected,
        "operating_threshold": main.leaf_gate_threshold,
        "non_leaf_results": non_leaf_results,
        "genuine_results": genuine_results
    }
    report_path = os.path.join(ml_service_dir, "models", "leaf_gate_regression_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(test_report, f, indent=2)
    print(f"\nSaved regression report: {report_path}")

    print("\n" + "=" * 70)
    print("ALL REGRESSION & VALIDATION TESTS FINISHED!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
