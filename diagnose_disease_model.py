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
    print("=" * 70)
    print("CROPGUARD AI — DISEASE MODEL DIAGNOSTIC RUNNER")
    print("=" * 70)

    base_dir = r"c:\3D-WEBSITE-TEMPLATE (1)"
    ml_models_dir = os.path.join(base_dir, "ml-service", "models")
    assets_dir = os.path.join(base_dir, "src", "assets")
    
    # 1. Inspect Demo Asset
    leaf_sample_path = os.path.join(assets_dir, "leaf_sample.png")
    print(f"\n[1] Demo Image Analysis:")
    print(f"  Target File: {leaf_sample_path}")
    print(f"  Exists: {os.path.exists(leaf_sample_path)}")
    
    if os.path.exists(leaf_sample_path):
        file_size = os.path.getsize(leaf_sample_path)
        sha256 = get_hash(leaf_sample_path)
        img = Image.open(leaf_sample_path)
        print(f"  File Size: {file_size} bytes ({file_size/1024:.2f} KB)")
        print(f"  Dimensions: {img.size[0]} x {img.size[1]}")
        print(f"  Format: {img.format}")
        print(f"  Mode: {img.mode}")
        print(f"  SHA256: {sha256}")
    else:
        print("  ERROR: leaf_sample.png not found!")
        return

    # Check for any other images in src/assets or public
    print("\n  Other assets in src/assets:")
    for f in os.listdir(assets_dir):
        fp = os.path.join(assets_dir, f)
        print(f"    - {f}: {os.path.getsize(fp)} bytes")

    public_dir = os.path.join(base_dir, "public")
    if os.path.exists(public_dir):
        print("\n  Assets in public/:")
        for f in os.listdir(public_dir):
            fp = os.path.join(public_dir, f)
            print(f"    - {f}: {os.path.getsize(fp)} bytes")

    # 2. Check Disease Classes JSON
    disease_classes_path = os.path.join(ml_models_dir, "disease_classes.json")
    with open(disease_classes_path, "r", encoding="utf-8") as f:
        class_data = json.load(f)
    classes = class_data.get("classes", [])
    print(f"\n[2] Disease Classes Verification:")
    print(f"  Total Classes: {len(classes)}")
    print(f"  Classes List:")
    for i, c in enumerate(classes):
        print(f"    Index {i:2d}: {c}")

    # 3. Load Model Checkpoint
    checkpoint_path = os.path.join(ml_models_dir, "disease_mobilenetv2_best.pth")
    print(f"\n[3] Model Checkpoint Verification:")
    print(f"  Checkpoint Path: {checkpoint_path}")
    print(f"  File Size: {os.path.getsize(checkpoint_path)} bytes")
    
    device = torch.device("cpu")
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, len(classes))

    ckpt = torch.load(checkpoint_path, map_location=device)
    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        model.load_state_dict(ckpt["model_state_dict"])
        print("  Loaded from dict['model_state_dict']")
    else:
        model.load_state_dict(ckpt)
        print("  Loaded direct state_dict")

    model.eval()

    # Preprocessing
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 4. Raw Disease Inference on Demo Image (leaf_sample.png)
    print(f"\n[4] Raw Disease Inference on Demo Image ({leaf_sample_path}):")
    img_rgb = Image.open(leaf_sample_path).convert("RGB")
    tensor = transform(img_rgb).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]

    top10_vals, top10_indices = torch.topk(probs, k=10)

    print(f"  {'Rank':<5} {'Index':<6} {'Full Class Name':<42} {'Confidence':<12} {'Logit':<10}")
    print("  " + "-" * 75)
    for rank, (val, idx) in enumerate(zip(top10_vals, top10_indices), start=1):
        cname = classes[idx.item()]
        conf = float(val.item()) * 100
        logit_val = float(logits[0, idx.item()].item())
        print(f"  {rank:<5} {idx.item():<6} {cname:<42} {conf:6.2f}%      {logit_val:8.4f}")

    # Determinism check
    print("\n  Testing determinism across 5 consecutive runs on demo image:")
    for r in range(5):
        with torch.no_grad():
            out = model(tensor)
            p = torch.softmax(out, dim=1)[0]
            top_val, top_idx = torch.max(p, dim=0)
            print(f"    Run {r+1}: {classes[top_idx.item()]} ({float(top_val.item())*100:.2f}%)")

    # 5. Search for True Tomato Images in Dataset
    print(f"\n[5] Testing True Held-out Tomato & Other Plant Images from Datasets:")
    
    # Check dataset directory
    datasets_dir = os.path.join(base_dir, "datasets")
    test_images = []
    
    # Let's search for images in datasets
    for root, dirs, files in os.walk(datasets_dir):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                full_p = os.path.join(root, f)
                # Check if it has tomato or other class names
                test_images.append(full_p)
                if len(test_images) >= 500:
                    break
        if len(test_images) >= 500:
            break

    print(f"  Found {len(test_images)} candidate images in datasets/")
    
    # Let's find specific Tomato images, e.g., Early Blight, Target Spot, Healthy, etc.
    tomato_samples = []
    strawberry_samples = []
    potato_samples = []
    corn_samples = []
    
    for p in test_images:
        p_lower = p.lower()
        if "tomato" in p_lower:
            tomato_samples.append(p)
        elif "strawberry" in p_lower:
            strawberry_samples.append(p)
        elif "potato" in p_lower:
            potato_samples.append(p)
        elif "corn" in p_lower:
            corn_samples.append(p)

    print(f"  Tomato samples found: {len(tomato_samples)}")
    print(f"  Strawberry samples found: {len(strawberry_samples)}")
    print(f"  Potato samples found: {len(potato_samples)}")
    print(f"  Corn samples found: {len(corn_samples)}")

    print("\n  Running inference on sample Tomato images:")
    for i, p in enumerate(tomato_samples[:5]):
        t_img = Image.open(p).convert("RGB")
        t_tensor = transform(t_img).unsqueeze(0).to(device)
        with torch.no_grad():
            t_out = model(t_tensor)
            t_prob = torch.softmax(t_out, dim=1)[0]
            top_val, top_idx = torch.max(t_prob, dim=0)
            cname = classes[top_idx.item()]
            conf = float(top_val.item()) * 100
        print(f"    Tomato Test #{i+1}: {os.path.basename(p)}")
        print(f"      Path: {p}")
        print(f"      Predicted: {cname} ({conf:.2f}%)")

    # Let's also check if leaf_sample.png matches any image in the dataset via hash
    print("\n[6] Searching for exact duplicate of demo image in datasets/ ...")
    demo_hash = get_hash(leaf_sample_path)
    match_found = None
    for p in test_images:
        try:
            if os.path.getsize(p) == file_size:
                if get_hash(p) == demo_hash:
                    match_found = p
                    break
        except Exception:
            pass

    if match_found:
        print(f"  EXACT MATCH FOUND IN DATASET: {match_found}")
    else:
        print("  No identical byte-for-byte match found in scanned dataset files.")

if __name__ == "__main__":
    main()
