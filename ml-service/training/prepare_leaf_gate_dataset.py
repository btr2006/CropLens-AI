"""
CropGuard AI - Leaf Gate Dataset Preparation Script

Creates a clean, balanced, leakage-controlled binary dataset:
- Class 0: non_leaf (people, buildings, roads, vehicles, food, animals, electronics, sky, objects)
- Class 1: valid_leaf (real plant leaves from multiple crop species, healthy & diseased)

Data Split:
- Train (70%)
- Validation (15%)
- Held-out Test (15%)
Strict SHA-256 deduplication ensures 0 duplicate images cross splits.
"""

import os
import sys
import glob
import shutil
import hashlib
import tarfile
import urllib.request
from PIL import Image, ImageDraw

def sha256_file(filepath):
    """Compute SHA-256 hash of a file for exact duplicate elimination."""
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def is_valid_image(filepath):
    """Ensure image can be opened and decoded cleanly."""
    try:
        with Image.open(filepath) as img:
            img.verify()
        with Image.open(filepath) as img:
            img = img.convert('RGB')
            w, h = img.size
            if w < 32 or h < 32:
                return False
        return True
    except Exception:
        return False

def download_imagenette_negatives(target_dir):
    """Download and extract Imagenette-160 for photographic non-leaf diversity."""
    os.makedirs(target_dir, exist_ok=True)
    archive_path = os.path.join(target_dir, "imagenette2-160.tgz")
    url = "https://s3.amazonaws.com/fast-ai-imageclas/imagenette2-160.tgz"

    extracted_flag = os.path.join(target_dir, "imagenette2-160")
    if os.path.exists(extracted_flag) and os.path.isdir(extracted_flag):
        print("[Dataset] Imagenette-160 already extracted.")
        return extracted_flag

    if not os.path.exists(archive_path):
        print(f"[Dataset] Downloading Imagenette-160 non-leaf dataset (~94 MB)...")
        urllib.request.urlretrieve(url, archive_path)
        print("[Dataset] Download complete.")

    print("[Dataset] Extracting Imagenette-160 archive...")
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=target_dir)
    print("[Dataset] Extraction complete.")
    return extracted_flag

def generate_supplemental_negatives(output_dir):
    """
    Generate clean synthetic/procedural non-leaf negative samples
    (screenshots, text pages, barcodes, sky gradients, geometric patterns).
    """
    os.makedirs(output_dir, exist_ok=True)
    samples = []
    
    # 1. UI screenshots & text pages
    for i in range(50):
        img = Image.new('RGB', (224, 224), color=(245, 245, 250))
        draw = ImageDraw.Draw(img)
        # Draw mock UI / text lines
        for y in range(20, 200, 15):
            line_w = 40 + (i * 7 + y) % 140
            draw.rectangle([20, y, 20 + line_w, y + 6], fill=(70, 80, 95))
        draw.rectangle([20, 10, 80, 16], fill=(59, 130, 246))
        p = os.path.join(output_dir, f"synth_screenshot_{i:03d}.png")
        img.save(p)
        samples.append(p)

    # 2. Sky & atmospheric gradients
    for i in range(50):
        img = Image.new('RGB', (224, 224))
        # Blue sky to horizon gradient
        for y in range(224):
            r = int(120 + 80 * (y / 224.0))
            g = int(180 + 60 * (y / 224.0))
            b = int(240 - 20 * (y / 224.0))
            for x in range(224):
                img.putpixel((x, y), (r, g, b))
        p = os.path.join(output_dir, f"synth_sky_{i:03d}.png")
        img.save(p)
        samples.append(p)

    # 3. Geometric textures / indoor tiles
    for i in range(50):
        img = Image.new('RGB', (224, 224), color=(200, 190, 180))
        draw = ImageDraw.Draw(img)
        tile_size = 28 + (i % 5) * 4
        for x in range(0, 224, tile_size):
            draw.line([(x, 0), (x, 224)], fill=(120, 110, 100), width=2)
        for y in range(0, 224, tile_size):
            draw.line([(0, y), (224, y)], fill=(120, 110, 100), width=2)
        p = os.path.join(output_dir, f"synth_tile_{i:03d}.png")
        img.save(p)
        samples.append(p)

    return samples

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    datasets_root = os.path.join(project_root, "datasets")
    target_base = os.path.join(datasets_root, "leaf_gate")

    disease_dir = os.path.join(
        datasets_root, "disease", "New Plant Diseases Dataset(Augmented)",
        "New Plant Diseases Dataset(Augmented)"
    )

    print("=" * 70)
    print("CropGuard AI - Leaf Gate Dataset Assembler")
    print("=" * 70)

    # 1. Collect Valid Leaf Images (Class: valid_leaf)
    print("\n[Step 1] Sourcing diverse plant leaf images across crops...")
    valid_leaf_files = []
    seen_hashes = set()

    # Sample from disease dataset (train + valid) across all crops
    crop_subdirs = glob.glob(os.path.join(disease_dir, "*", "*"))
    print(f"Found {len(crop_subdirs)} crop-disease subdirectories.")

    # Target ~3,200 diverse leaf images (~85 per class)
    for sdir in crop_subdirs:
        img_candidates = glob.glob(os.path.join(sdir, "*.JPG")) + glob.glob(os.path.join(sdir, "*.jpg"))
        for fpath in img_candidates[:85]:
            fhash = sha256_file(fpath)
            if fhash not in seen_hashes and is_valid_image(fpath):
                seen_hashes.add(fhash)
                valid_leaf_files.append(fpath)

    # Also sample some coffee leaves from RoCoLe if present
    rocole_photos = glob.glob(os.path.join(datasets_root, "severity", "RoCoLe_clean", "images", "*.jpg"))
    for fpath in rocole_photos[:200]:
        fhash = sha256_file(fpath)
        if fhash not in seen_hashes and is_valid_image(fpath):
            seen_hashes.add(fhash)
            valid_leaf_files.append(fpath)

    print(f"Collected {len(valid_leaf_files)} unique, verified plant leaf images.")

    # 2. Collect Non-Leaf Images (Class: non_leaf)
    print("\n[Step 2] Sourcing diverse non-leaf negative images...")
    neg_cache_dir = os.path.join(datasets_root, "_cache_negatives")
    imagenette_dir = download_imagenette_negatives(neg_cache_dir)

    non_leaf_files = []
    # Imagenette classes: 10 diverse classes
    imagenette_images = glob.glob(os.path.join(imagenette_dir, "**", "*.JPEG"), recursive=True)
    print(f"Found {len(imagenette_images)} candidate Imagenette images.")

    # Select ~3,000 diverse non-leaf images
    for fpath in imagenette_images[:3000]:
        fhash = sha256_file(fpath)
        if fhash not in seen_hashes and is_valid_image(fpath):
            seen_hashes.add(fhash)
            non_leaf_files.append(fpath)

    # Add supplemental procedural negatives (screenshots, sky, textures)
    synth_dir = os.path.join(neg_cache_dir, "synthetic")
    synth_files = generate_supplemental_negatives(synth_dir)
    for fpath in synth_files:
        fhash = sha256_file(fpath)
        if fhash not in seen_hashes and is_valid_image(fpath):
            seen_hashes.add(fhash)
            non_leaf_files.append(fpath)

    print(f"Collected {len(non_leaf_files)} unique, verified non-leaf images.")

    # Balance counts
    target_count = min(len(valid_leaf_files), len(non_leaf_files))
    valid_leaf_files = valid_leaf_files[:target_count]
    non_leaf_files = non_leaf_files[:target_count]
    print(f"\nBalanced dataset: {target_count} valid_leaf vs {target_count} non_leaf (Total: {target_count * 2})")

    # 3. Partition into Train (70%), Val (15%), Test (15%)
    print("\n[Step 3] Partitioning into train / val / test splits...")
    import random
    random.seed(42)
    random.shuffle(valid_leaf_files)
    random.shuffle(non_leaf_files)

    n_train = int(target_count * 0.70)
    n_val = int(target_count * 0.15)
    n_test = target_count - n_train - n_val

    splits = {
        'train': {
            'valid_leaf': valid_leaf_files[:n_train],
            'non_leaf': non_leaf_files[:n_train]
        },
        'val': {
            'valid_leaf': valid_leaf_files[n_train:n_train + n_val],
            'non_leaf': non_leaf_files[n_train:n_train + n_val]
        },
        'test': {
            'valid_leaf': valid_leaf_files[n_train + n_val:],
            'non_leaf': non_leaf_files[n_train + n_val:]
        }
    }

    # Clean existing target_base
    if os.path.exists(target_base):
        shutil.rmtree(target_base)

    split_manifest = {}
    for split_name, class_dict in splits.items():
        split_manifest[split_name] = {}
        for class_name, files in class_dict.items():
            dest_dir = os.path.join(target_base, split_name, class_name)
            os.makedirs(dest_dir, exist_ok=True)
            split_manifest[split_name][class_name] = len(files)
            for idx, src_path in enumerate(files):
                ext = os.path.splitext(src_path)[1].lower() or ".jpg"
                dest_filename = f"{class_name}_{idx:05d}{ext}"
                dest_path = os.path.join(dest_dir, dest_filename)
                shutil.copy2(src_path, dest_path)

    print("\n[Step 4] Dataset Assembly Finished Successfully!")
    print(f"Target location: {target_base}")
    for s_name, counts in split_manifest.items():
        print(f"  - {s_name:5s}: {counts['valid_leaf']} valid_leaf, {counts['non_leaf']} non_leaf (Total: {counts['valid_leaf'] + counts['non_leaf']})")

if __name__ == "__main__":
    main()
