"""
CropGuard AI - Leaf Gate MobileNetV2 Binary Classifier Training

Trains a dedicated binary gating model:
- Class 0: non_leaf
- Class 1: valid_leaf

Architecture:
- MobileNetV2 with fine-tuned classifier head & high-level feature layers
- Optimized for Intel Arc XPU / CPU fallback

Key Objectives:
- High rejection of random non-plant / non-leaf images (Low False Acceptance Rate)
- High acceptance of legitimate crop leaves (Low False Rejection Rate)
- Empirical threshold calibration on validation set
- Strict evaluation on held-out test split (910 unseen images, 0 data leakage)
"""

import os
import sys
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, precision_recall_fscore_support

def get_device():
    """Detect and return the appropriate compute device (prefer Intel Arc XPU)."""
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        name = torch.xpu.get_device_name(0)
        print(f"[Device Selection] Utilizing Intel Arc XPU: {name}")
        return torch.device("xpu")
    elif torch.cuda.is_available():
        print(f"[Device Selection] Utilizing CUDA GPU: {torch.cuda.get_device_name(0)}")
        return torch.device("cuda")
    else:
        print("[Device Selection] Dedicated hardware unavailable. Utilizing CPU.")
        return torch.device("cpu")

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct_preds = 0
    total_samples = 0

    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct_preds += torch.sum(preds == labels.data).item()
        total_samples += images.size(0)

    return running_loss / total_samples, correct_preds / total_samples

def evaluate_probabilities(model, dataloader, device):
    """Run model on dataloader and collect true labels and class 1 (valid_leaf) probabilities."""
    model.eval()
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)[:, 1].cpu().numpy()
            all_probs.extend(probs)
            all_labels.extend(labels.numpy())

    return np.array(all_labels), np.array(all_probs)

def calibrate_threshold(val_labels, val_probs):
    """
    Sweep decision thresholds from 0.1 to 0.9 to find the optimal operating point.
    Objective:
    - Minimize False Acceptance Rate (FAR, non-leaf mistakenly accepted as leaf)
    - Keep False Rejection Rate (FRR, real leaf mistakenly rejected) <= 2.5%
    """
    thresholds = np.linspace(0.10, 0.90, 81)
    best_threshold = 0.50
    min_far = 1.0
    best_stats = {}

    results = []
    for t in thresholds:
        preds = (val_probs >= t).astype(int)
        
        # Confusion matrix elements:
        # 0 = non_leaf, 1 = valid_leaf
        tn = np.sum((val_labels == 0) & (preds == 0))
        fp = np.sum((val_labels == 0) & (preds == 1))
        fn = np.sum((val_labels == 1) & (preds == 0))
        tp = np.sum((val_labels == 1) & (preds == 1))

        far = fp / (fp + tn) if (fp + tn) > 0 else 0.0  # False Acceptance Rate
        frr = fn / (fn + tp) if (fn + tp) > 0 else 0.0  # False Rejection Rate
        acc = (tp + tn) / (tp + tn + fp + fn)

        results.append({
            "threshold": round(float(t), 3),
            "far": round(float(far), 4),
            "frr": round(float(frr), 4),
            "accuracy": round(float(acc), 4)
        })

        # Selection criterion: FRR <= 0.025 and lowest FAR
        if frr <= 0.025:
            if far < min_far or (far == min_far and t > best_threshold):
                min_far = far
                best_threshold = float(t)
                best_stats = {
                    "threshold": round(best_threshold, 3),
                    "far": round(float(far), 4),
                    "frr": round(float(frr), 4),
                    "val_accuracy": round(float(acc), 4)
                }

    # Fallback if no threshold met strict <= 2.5% FRR
    if not best_stats:
        # Choose threshold that minimizes FAR + FRR
        best_idx = np.argmin([r["far"] + r["frr"] for r in results])
        best_threshold = results[best_idx]["threshold"]
        best_stats = results[best_idx]

    return best_threshold, best_stats, results

def plot_confusion_matrix(cm, class_names, output_path, title="Leaf Gate Confusion Matrix"):
    """Plot and save professional styled confusion matrix."""
    fig, ax = plt.subplots(figsize=(6, 5), dpi=300)
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Greens)
    ax.figure.colorbar(im, ax=ax)
    
    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title=title,
        ylabel='True Label',
        xlabel='Predicted Label'
    )

    plt.setp(ax.get_xticklabels(), rotation=0, ha="center")

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            pct = val / np.sum(cm[i, :]) * 100.0
            ax.text(j, i, f"{val}\n({pct:.1f}%)",
                    ha="center", va="center",
                    color="white" if val > thresh else "black",
                    fontsize=12, fontweight="bold")

    fig.tight_layout()
    plt.savefig(output_path, bbox_inches='tight')
    plt.close()

def main():
    print("=" * 70)
    print("CropGuard AI - Leaf Gate MobileNetV2 Binary Classifier Training")
    print("=" * 70)

    device = get_device()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    data_dir = os.path.join(project_root, "datasets", "leaf_gate")
    models_dir = os.path.join(project_root, "ml-service", "models")
    os.makedirs(models_dir, exist_ok=True)

    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")
    test_dir = os.path.join(data_dir, "test")

    for p, name in [(train_dir, "Train"), (val_dir, "Val"), (test_dir, "Test")]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"{name} split not found at: {p}. Run prepare_leaf_gate_dataset.py first.")

    # Data transforms
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.15, contrast=0.15),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'test': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    }

    print("\n[1] Loading dataset splits...")
    train_dataset = datasets.ImageFolder(train_dir, transform=data_transforms['train'])
    val_dataset = datasets.ImageFolder(val_dir, transform=data_transforms['val'])
    test_dataset = datasets.ImageFolder(test_dir, transform=data_transforms['test'])

    classes = train_dataset.classes
    print(f"    Classes: {classes}")
    print(f"    Class to index: {train_dataset.class_to_idx}")
    print(f"    Train size: {len(train_dataset)}")
    print(f"    Val size:   {len(val_dataset)}")
    print(f"    Test size:  {len(test_dataset)}")

    # Ensure class 0 is non_leaf and class 1 is valid_leaf
    assert classes == ['non_leaf', 'valid_leaf'], f"Unexpected classes order: {classes}"

    batch_size = 32
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Export classes definition
    classes_json_path = os.path.join(models_dir, "leaf_gate_classes.json")
    with open(classes_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "classes": classes,
            "class_to_idx": train_dataset.class_to_idx,
            "idx_to_class": {idx: c for c, idx in train_dataset.class_to_idx.items()},
            "target_class": "valid_leaf",
            "target_idx": 1
        }, f, indent=2)

    # Initialize MobileNetV2
    print("\n[2] Initializing MobileNetV2 architecture...")
    try:
        weights = models.MobileNet_V2_Weights.DEFAULT
        model = models.mobilenet_v2(weights=weights)
    except AttributeError:
        model = models.mobilenet_v2(pretrained=True)

    # Unfreeze the last feature blocks to adapt higher-level plant textures
    for param in model.features[:-4].parameters():
        param.requires_grad = False
    for param in model.features[-4:].parameters():
        param.requires_grad = True

    # Binary classifier head
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 2)
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam([
        {'params': model.features[-4:].parameters(), 'lr': 1e-4},
        {'params': model.classifier.parameters(), 'lr': 1e-3}
    ], weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=6)

    epochs = 6
    best_val_acc = 0.0
    history = {
        "epochs": epochs,
        "batch_size": batch_size,
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "epoch_times_s": []
    }

    model_best_path = os.path.join(models_dir, "leaf_gate_mobilenetv2_best.pth")

    print("\n[3] Training MobileNetV2 Leaf Gate on Intel Arc XPU...")
    training_start = time.time()

    for epoch in range(epochs):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        scheduler.step()

        # Validation pass
        val_labels, val_probs = evaluate_probabilities(model, val_loader, device)
        val_preds = (val_probs >= 0.50).astype(int)
        val_acc = accuracy_score(val_labels, val_preds)

        # Compute validation loss
        val_loss = 0.0
        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                out = model(imgs)
                val_loss += criterion(out, lbls).item() * imgs.size(0)
        val_loss /= len(val_dataset)

        elapsed = time.time() - t0
        history["train_loss"].append(round(float(train_loss), 4))
        history["train_acc"].append(round(float(train_acc), 4))
        history["val_loss"].append(round(float(val_loss), 4))
        history["val_acc"].append(round(float(val_acc), 4))
        history["epoch_times_s"].append(round(float(elapsed), 2))

        print(f"  Epoch [{epoch+1}/{epochs}] ({elapsed:.1f}s) | "
              f"Train Loss: {train_loss:.4f}, Acc: {train_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f}, Acc: {val_acc*100:.2f}%")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'best_val_acc': float(best_val_acc),
                'classes': classes,
                'class_to_idx': train_dataset.class_to_idx,
                'architecture': 'mobilenet_v2_leaf_gate'
            }, model_best_path)
            print(f"    --> Checkpoint saved (val_acc: {val_acc*100:.2f}%)")

    total_train_time = round(time.time() - training_start, 2)
    print(f"\n[4] Training complete in {total_train_time:.1f}s. Best Val Acc: {best_val_acc*100:.2f}%")

    # Load best checkpoint for calibration & evaluation
    checkpoint = torch.load(model_best_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    # Step 5: Threshold Calibration on Validation Set
    print("\n[5] Calibrating Operating Threshold on Validation Set...")
    val_labels, val_probs = evaluate_probabilities(model, val_loader, device)
    best_threshold, best_val_stats, threshold_sweep = calibrate_threshold(val_labels, val_probs)
    print(f"    Operating Threshold selected: {best_threshold:.3f}")
    print(f"    Validation Metrics at threshold {best_threshold:.3f}:")
    print(f"      - FAR (Non-leaf accepted): {best_val_stats['far']*100:.2f}%")
    print(f"      - FRR (Leaf rejected):     {best_val_stats['frr']*100:.2f}%")
    print(f"      - Val Accuracy:            {best_val_stats['val_accuracy']*100:.2f}%")

    # Step 6: Strict Evaluation on Held-Out Test Split
    print("\n[6] Evaluating on Held-Out Test Set (910 unseen images)...")
    test_labels, test_probs = evaluate_probabilities(model, test_loader, device)
    test_preds = (test_probs >= best_threshold).astype(int)

    # Compute metrics
    acc = accuracy_score(test_labels, test_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        test_labels, test_preds, average='binary', pos_label=1
    )

    cm = confusion_matrix(test_labels, test_preds)
    # cm layout:
    # [[TN, FP],
    #  [FN, TP]]
    tn, fp, fn, tp = cm.ravel()

    leaf_recall = tp / (tp + fn)  # Sensitivity for valid_leaf
    non_leaf_recall = tn / (tn + fp)  # Specificity (correctly rejecting non-leaf)
    far = fp / (tn + fp)  # False Acceptance Rate
    frr = fn / (tp + fn)  # False Rejection Rate

    print("-" * 50)
    print(f"  Test Accuracy:               {acc*100:.2f}%")
    print(f"  Leaf Precision:              {precision*100:.2f}%")
    print(f"  Leaf Recall:                 {leaf_recall*100:.2f}%")
    print(f"  Non-Leaf Recall:             {non_leaf_recall*100:.2f}%")
    print(f"  Leaf F1 Score:               {f1*100:.2f}%")
    print(f"  False Acceptance Rate (FAR): {far*100:.2f}%  (target: minimal)")
    print(f"  False Rejection Rate (FRR):  {frr*100:.2f}%  (target: <= 2%)")
    print(f"  Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print("-" * 50)

    # Save Confusion Matrix figure
    cm_path = os.path.join(models_dir, "leaf_gate_confusion_matrix.png")
    plot_confusion_matrix(cm, ["Non-Leaf", "Valid Leaf"], cm_path, title=f"Leaf Gate Confusion Matrix (Threshold={best_threshold})")
    print(f"    Saved confusion matrix figure: {cm_path}")

    # Step 7: Measure Inference Speed (Single Image Latency)
    print("\n[7] Benchmarking Leaf Gate Inference Latency...")
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    # Warmup
    for _ in range(10):
        _ = model(dummy_input)

    latencies = []
    for _ in range(100):
        t_start = time.perf_counter()
        with torch.no_grad():
            out = model(dummy_input)
            _ = torch.softmax(out, dim=1)[:, 1].item()
        t_end = time.perf_counter()
        latencies.append((t_end - t_start) * 1000.0)

    mean_latency_ms = round(float(np.mean(latencies)), 2)
    p95_latency_ms = round(float(np.percentile(latencies, 95)), 2)
    print(f"    Mean Inference Latency: {mean_latency_ms} ms (P95: {p95_latency_ms} ms)")

    # Save Test Metrics JSON
    test_metrics = {
        "model_architecture": "MobileNetV2 (Binary Leaf Gate)",
        "device": str(device),
        "total_test_samples": int(len(test_dataset)),
        "test_leaf_samples": int(np.sum(test_labels == 1)),
        "test_non_leaf_samples": int(np.sum(test_labels == 0)),
        "operating_threshold": float(best_threshold),
        "threshold_selection_strategy": "Empirical sweep on validation set minimizing FAR subject to FRR <= 2.5%",
        "test_accuracy": round(float(acc), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "leaf_recall": round(float(leaf_recall), 4),
        "non_leaf_recall": round(float(non_leaf_recall), 4),
        "f1_score": round(float(f1), 4),
        "false_acceptance_rate": round(float(far), 4),
        "false_rejection_rate": round(float(frr), 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "latency_ms": {
            "mean": mean_latency_ms,
            "p95": p95_latency_ms
        }
    }

    test_metrics_path = os.path.join(models_dir, "leaf_gate_test_metrics.json")
    with open(test_metrics_path, "w", encoding="utf-8") as f:
        json.dump(test_metrics, f, indent=2)
    print(f"    Saved test metrics: {test_metrics_path}")

    # Save Training History JSON
    history["total_training_time_s"] = total_train_time
    history["best_val_acc"] = round(float(best_val_acc), 4)
    history_path = os.path.join(models_dir, "leaf_gate_training_history.json")
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"    Saved training history: {history_path}")

    # Save Notes JSON
    notes = {
        "model_role": "First-line semantic leaf validation gate before disease classification",
        "checkpoint_file": "leaf_gate_mobilenetv2_best.pth",
        "classes_file": "leaf_gate_classes.json",
        "dataset_composition": {
            "positive_source": "PlantVillage (14 crops, 38 classes, healthy & diseased) + RoCoLe coffee leaves",
            "negative_source": "Imagenette-160 (10 diverse classes: vehicles, buildings, animals, tools, instruments) + synthetic UI screenshots, sky gradients, textures",
            "leakage_prevention": "Strict SHA-256 deduplication across train, val, and test splits"
        },
        "operating_threshold": float(best_threshold),
        "safety_guarantees": "Stops downstream inference when non_leaf is detected; does NOT claim 100% OOD detection; operates in tandem with image quality checks and disease classifier confidence."
    }
    notes_path = os.path.join(models_dir, "leaf_gate_notes.json")
    with open(notes_path, "w", encoding="utf-8") as f:
        json.dump(notes, f, indent=2)
    print(f"    Saved model notes: {notes_path}")

    # Re-save best checkpoint including threshold and test metrics for convenience
    checkpoint['operating_threshold'] = float(best_threshold)
    checkpoint['test_metrics'] = test_metrics
    torch.save(checkpoint, model_best_path)
    print(f"    Updated checkpoint with calibrated threshold: {model_best_path}")

    print("\n" + "=" * 70)
    print("LEAF GATE TRAINING & CALIBRATION FINISHED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
