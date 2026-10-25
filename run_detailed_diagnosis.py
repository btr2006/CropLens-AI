import os
import sys
import json
import hashlib
import time
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

def get_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def main():
    base_dir = r"c:\3D-WEBSITE-TEMPLATE (1)"
    ml_models_dir = os.path.join(base_dir, "ml-service", "models")
    assets_dir = os.path.join(base_dir, "src", "assets")
    
    # 1. Classes & Checkpoint
    disease_classes_path = os.path.join(ml_models_dir, "disease_classes.json")
    with open(disease_classes_path, "r", encoding="utf-8") as f:
        class_data = json.load(f)
    classes = class_data.get("classes", [])

    checkpoint_path = os.path.join(ml_models_dir, "disease_mobilenetv2_best.pth")
    device = torch.device("cpu")
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, len(classes))

    ckpt = torch.load(checkpoint_path, map_location=device)
    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        model.load_state_dict(ckpt["model_state_dict"])
    else:
        model.load_state_dict(ckpt)
    model.eval()

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    print("=" * 80)
    print("STEP 1: DEMO IMAGE INFERENCE & DETAILS")
    print("=" * 80)
    leaf_sample_path = os.path.join(assets_dir, "leaf_sample.png")
    img = Image.open(leaf_sample_path)
    print(f"Path: {leaf_sample_path}")
    print(f"Dimensions: {img.size[0]} x {img.size[1]}")
    print(f"Format: {img.format}, Mode: {img.mode}, File size: {os.path.getsize(leaf_sample_path)} bytes")
    print(f"SHA256: {get_hash(leaf_sample_path)}")

    tensor = transform(img.convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
    
    top10_vals, top10_indices = torch.topk(probs, k=10)
    print(f"\nTop 10 Predictions on {os.path.basename(leaf_sample_path)}:")
    print(f"{'Rank':<5} {'Index':<6} {'Full Class Name':<44} {'Confidence':<12} {'Logit':<10}")
    print("-" * 78)
    for rank, (val, idx) in enumerate(zip(top10_vals, top10_indices), start=1):
        cname = classes[idx.item()]
        conf = float(val.item()) * 100
        logit_val = float(logits[0, idx.item()].item())
        print(f"{rank:<5} {idx.item():<6} {cname:<44} {conf:6.2f}%      {logit_val:8.4f}")

    print("\n" + "=" * 80)
    print("STEP 2: TEST ON KNOWN HELD-OUT TOMATO IMAGES (TEST SET)")
    print("=" * 80)
    test_dir = os.path.join(base_dir, "datasets", "disease", "test", "test")
    
    test_files = [
        ("TomatoEarlyBlight1.JPG", "Tomato___Early_blight"),
        ("TomatoEarlyBlight2.JPG", "Tomato___Early_blight"),
        ("TomatoEarlyBlight3.JPG", "Tomato___Early_blight"),
        ("TomatoEarlyBlight4.JPG", "Tomato___Early_blight"),
        ("TomatoEarlyBlight5.JPG", "Tomato___Early_blight"),
        ("TomatoEarlyBlight6.JPG", "Tomato___Early_blight"),
        ("TomatoHealthy1.JPG", "Tomato___healthy"),
        ("TomatoHealthy2.JPG", "Tomato___healthy"),
        ("TomatoHealthy3.JPG", "Tomato___healthy"),
        ("TomatoYellowCurlVirus1.JPG", "Tomato___Tomato_Yellow_Leaf_Curl_Virus"),
        ("PotatoEarlyBlight1.JPG", "Potato___Early_blight"),
        ("CornCommonRust1.JPG", "Corn_(maize)___Common_rust_"),
        ("AppleCedarRust1.JPG", "Apple___Cedar_apple_rust"),
    ]

    for fname, expected_class in test_files:
        fpath = os.path.join(test_dir, fname)
        if not os.path.exists(fpath):
            continue
        t_img = Image.open(fpath).convert("RGB")
        t_tensor = transform(t_img).unsqueeze(0).to(device)
        with torch.no_grad():
            t_out = model(t_tensor)
            t_probs = torch.softmax(t_out, dim=1)[0]
            top_val, top_idx = torch.max(t_probs, dim=0)
            pred_class = classes[top_idx.item()]
            conf = float(top_val.item()) * 100
            is_match = "CORRECT" if pred_class == expected_class else "MISMATCH"
            print(f"[{is_match}] {fname:<28} Expected: {expected_class:<35} Predicted: {pred_class:<35} ({conf:5.2f}%)")

    print("\n" + "=" * 80)
    print("STEP 3: TEST ON VALIDATION SET SAMPLES (Tomato vs Strawberry)")
    print("=" * 80)
    valid_dir = os.path.join(base_dir, "datasets", "disease", "New Plant Diseases Dataset(Augmented)", "New Plant Diseases Dataset(Augmented)", "valid")
    
    classes_to_check = [
        "Tomato___Early_blight",
        "Tomato___Target_Spot",
        "Tomato___healthy",
        "Strawberry___Leaf_scorch"
    ]

    for c_name in classes_to_check:
        c_dir = os.path.join(valid_dir, c_name)
        if os.path.exists(c_dir):
            images_in_dir = [f for f in os.listdir(c_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))][:3]
            print(f"\n--- Ground Truth Class: {c_name} ({len(os.listdir(c_dir))} valid images) ---")
            for im_f in images_in_dir:
                ip = os.path.join(c_dir, im_f)
                v_img = Image.open(ip).convert("RGB")
                v_tensor = transform(v_img).unsqueeze(0).to(device)
                with torch.no_grad():
                    v_out = model(v_tensor)
                    v_probs = torch.softmax(v_out, dim=1)[0]
                    v_val, v_idx = torch.max(v_probs, dim=0)
                    v_pred = classes[v_idx.item()]
                    v_conf = float(v_val.item()) * 100
                    status = "MATCH" if v_pred == c_name else "FAIL"
                    print(f"  [{status}] {im_f:<36} -> Predicted: {v_pred} ({v_conf:5.2f}%)")

if __name__ == "__main__":
    main()
