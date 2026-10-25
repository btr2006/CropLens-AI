import os
import time
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import precision_recall_fscore_support, accuracy_score, confusion_matrix, f1_score
import matplotlib.pyplot as plt

def get_device():
    """Detect and return the appropriate device (prefer Intel Arc XPU if available)."""
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        print(f"[Device Selection] Using Intel Arc XPU: {torch.xpu.get_device_name(0)}")
        return torch.device("xpu")
    else:
        print("[Device Selection] Intel Arc XPU is unavailable. Falling back to CPU.")
        return torch.device("cpu")

def train_epoch(model, dataloader, criterion, optimizer, device):
    """Run one epoch of model training over the dataset."""
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

    epoch_loss = running_loss / total_samples
    epoch_acc = correct_preds / total_samples
    return epoch_loss, epoch_acc

def validate_epoch(model, dataloader, criterion, device):
    """Run validation over dataset and compute loss, accuracy, and Macro-F1."""
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_targets = []
    total_samples = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.cpu().numpy())
            total_samples += images.size(0)

    epoch_loss = running_loss / total_samples
    epoch_acc = accuracy_score(all_targets, all_preds)
    epoch_macro_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0)

    return epoch_loss, epoch_acc, epoch_macro_f1, all_targets, all_preds

def evaluate_test_set(model, dataloader, class_names, device):
    """Evaluate model on test set and return detailed metrics dict and confusion matrix."""
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.numpy())

    acc = float(accuracy_score(all_targets, all_preds))
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        all_targets, all_preds, average="macro", zero_division=0
    )
    prec_per_class, rec_per_class, f1_per_class, support_per_class = precision_recall_fscore_support(
        all_targets, all_preds, average=None, zero_division=0
    )

    cm = confusion_matrix(all_targets, all_preds)

    per_class_metrics = {}
    for idx, name in enumerate(class_names):
        per_class_metrics[name] = {
            "precision": float(round(prec_per_class[idx], 4)),
            "recall": float(round(rec_per_class[idx], 4)),
            "f1_score": float(round(f1_per_class[idx], 4)),
            "support": int(support_per_class[idx])
        }

    test_metrics = {
        "accuracy": float(round(acc, 4)),
        "macro_precision": float(round(prec_macro, 4)),
        "macro_recall": float(round(rec_macro, 4)),
        "macro_f1": float(round(f1_macro, 4)),
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": cm.tolist()
    }

    return test_metrics, cm

def plot_and_save_confusion_matrix(cm, class_names, save_path):
    """Plot confusion matrix heatmap and save to png."""
    fig, ax = plt.subplots(figsize=(8, 6))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title='RoCoLe Severity Confusion Matrix (Test Set)',
        ylabel='True Label',
        xlabel='Predicted Label'
    )

    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    # Loop over data dimensions and create text annotations.
    fmt = 'd'
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], fmt),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black")

    fig.tight_layout()
    plt.savefig(save_path, bbox_inches='tight', dpi=150)
    plt.close()

def run_single_inference(model, test_dataset, class_names, device):
    """Run inference on a single test image and return results."""
    model.eval()

    # Get sample image (e.g. index 0)
    img_tensor, label_idx = test_dataset[0]
    img_path = test_dataset.samples[0][0]
    filename = os.path.basename(img_path)
    actual_class = class_names[label_idx]

    with torch.no_grad():
        input_tensor = img_tensor.unsqueeze(0).to(device)
        outputs = model(input_tensor)
        probs = torch.softmax(outputs, dim=1)[0]
        pred_idx = torch.argmax(probs).item()
        confidence = probs[pred_idx].item()
        predicted_class = class_names[pred_idx]

    return {
        "filename": filename,
        "actual_class": actual_class,
        "predicted_class": predicted_class,
        "confidence": float(round(confidence, 4))
    }

def main():
    print("=" * 70)
    print("CropGuard AI - MobileNetV2 Coffee Leaf Rust Severity Pipeline")
    print("=" * 70)

    start_training_wall_time = time.time()

    # 1. Device selection
    device = get_device()

    # 2. Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    split_dir = os.path.join(project_root, "datasets", "severity", "RoCoLe_clean", "split")
    train_dir = os.path.join(split_dir, "train")
    val_dir = os.path.join(split_dir, "val")
    test_dir = os.path.join(split_dir, "test")

    models_dir = os.path.join(project_root, "ml-service", "models")
    os.makedirs(models_dir, exist_ok=True)

    model_save_path = os.path.join(models_dir, "severity_mobilenetv2_best.pth")
    classes_save_path = os.path.join(models_dir, "severity_classes.json")
    history_save_path = os.path.join(models_dir, "severity_training_history.json")
    metrics_save_path = os.path.join(models_dir, "severity_test_metrics.json")
    cm_image_path = os.path.join(models_dir, "severity_confusion_matrix.png")

    print(f"\n[1] Resolving Paths:")
    print(f"    Train Dir:       {train_dir}")
    print(f"    Val Dir:         {val_dir}")
    print(f"    Test Dir:        {test_dir}")
    print(f"    Model Save Path: {model_save_path}")

    # 3. Image Transforms (224x224 RGB, ImageNet normalization)
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ]),
        'eval': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    }

    # 4. Load Datasets
    print("\n[2] Loading dataset splits...")
    train_dataset = datasets.ImageFolder(root=train_dir, transform=data_transforms['train'])
    val_dataset = datasets.ImageFolder(root=val_dir, transform=data_transforms['eval'])
    test_dataset = datasets.ImageFolder(root=test_dir, transform=data_transforms['eval'])

    class_names = train_dataset.classes
    num_classes = len(class_names)

    print(f"    Classes ({num_classes}): {class_names}")
    print(f"    Train Samples: {len(train_dataset)}")
    print(f"    Val Samples:   {len(val_dataset)}")
    print(f"    Test Samples:  {len(test_dataset)}")

    batch_size = 16
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # 5. Export Class Mapping JSON
    class_mapping = {
        "classes": class_names,
        "class_to_idx": train_dataset.class_to_idx,
        "idx_to_class": {idx: cls_name for cls_name, idx in train_dataset.class_to_idx.items()}
    }
    with open(classes_save_path, "w", encoding="utf-8") as f:
        json.dump(class_mapping, f, indent=2)

    # 6. Calculate Class Weights for Imbalanced Loss
    class_counts = [0] * num_classes
    for _, label_idx in train_dataset.samples:
        class_counts[label_idx] += 1

    total_train_samples = len(train_dataset)
    class_weights = [total_train_samples / (num_classes * count) for count in class_counts]
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device)

    print(f"\n[3] Class Counts in Train Set: {dict(zip(class_names, class_counts))}")
    print(f"    Computed Class Weights: {dict(zip(class_names, [round(w, 4) for w in class_weights]))}")

    # 7. Model Initialization (MobileNetV2 Transfer Learning)
    print("\n[4] Building MobileNetV2 Architecture...")
    try:
        weights = models.MobileNet_V2_Weights.DEFAULT
        model = models.mobilenet_v2(weights=weights)
    except AttributeError:
        model = models.mobilenet_v2(pretrained=True)

    # Freeze feature extractor
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace classifier head for 5 severity classes
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)

    model = model.to(device)

    # 8. Loss Function and Optimizer
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=0.001)

    # 9. Training Loop (10 epochs)
    epochs = 10
    best_val_macro_f1 = 0.0
    history = {
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": 0.001,
        "class_weights": dict(zip(class_names, [round(w, 4) for w in class_weights])),
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "val_macro_f1": []
    }

    print("\n[5] Training Classifier Head (Selecting Best Model by Validation Macro-F1)...")
    print("-" * 70)

    for epoch in range(epochs):
        t0 = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, val_macro_f1, _, _ = validate_epoch(model, val_loader, criterion, device)
        t_elapsed = time.time() - t0

        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 4))
        history["val_macro_f1"].append(round(val_macro_f1, 4))

        print(
            f"Epoch [{epoch+1:02d}/{epochs:02d}] ({t_elapsed:.1f}s) | "
            f"Train Loss: {train_loss:.4f} - Train Acc: {train_acc*100:.2f}% | "
            f"Val Loss: {val_loss:.4f} - Val Acc: {val_acc*100:.2f}% - Val Macro-F1: {val_macro_f1:.4f}"
        )

        # Selection criterion: Validation Macro-F1
        if val_macro_f1 > best_val_macro_f1:
            best_val_macro_f1 = val_macro_f1
            print(f"    --> Best Validation Macro-F1 improved to {val_macro_f1:.4f}. Saving model checkpoint...")
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'best_val_macro_f1': best_val_macro_f1,
                'val_acc': val_acc,
                'num_classes': num_classes,
                'classes': class_names,
                'architecture': 'mobilenet_v2'
            }, model_save_path)

    total_training_time = time.time() - start_training_wall_time

    # Save History JSON
    with open(history_save_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    # 10. Load Best Model Checkpoint for Final Evaluation & Inference
    print("\n[6] Loading Best Model Checkpoint for Held-Out Test Set Evaluation...")
    checkpoint = torch.load(model_save_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])

    # Evaluate on TEST set
    test_metrics, cm = evaluate_test_set(model, test_loader, class_names, device)

    # Save Test Metrics JSON
    with open(metrics_save_path, "w", encoding="utf-8") as f:
        json.dump(test_metrics, f, indent=2)

    # Plot & Save Confusion Matrix
    plot_and_save_confusion_matrix(cm, class_names, cm_image_path)

    # 11. Run Single Test Image Inference
    sample_inference = run_single_inference(model, test_dataset, class_names, device)

    print("\n" + "=" * 70)
    print("SEVERITY MODEL TRAINING & EVALUATION REPORT")
    print("=" * 70)
    print(f"1. Training Time:             {total_training_time:.2f} seconds")
    print(f"2. Number of Epochs:          {epochs}")
    print(f"3. Best Validation Macro-F1:  {best_val_macro_f1:.4f}")
    print(f"4. Test Accuracy:             {test_metrics['accuracy']*100:.2f}%")
    print(f"5. Test Macro Precision:      {test_metrics['macro_precision']:.4f}")
    print(f"6. Test Macro Recall:         {test_metrics['macro_recall']:.4f}")
    print(f"7. Test Macro F1:             {test_metrics['macro_f1']:.4f}")
    print("\n8. Per-Class Metrics:")
    for cls_name, m in test_metrics["per_class_metrics"].items():
        print(f"   - {cls_name:15s} | Prec: {m['precision']:.4f} | Rec: {m['recall']:.4f} | F1: {m['f1_score']:.4f} | Support: {m['support']}")

    print(f"\n9. Confusion Matrix Image:     {cm_image_path}")
    print(f"10. Test Image Inference:      File: {sample_inference['filename']} | Actual: {sample_inference['actual_class']} | Pred: {sample_inference['predicted_class']} | Conf: {sample_inference['confidence']*100:.2f}%")
    print(f"11. Saved File Paths:")
    print(f"    - Model Checkpoint:        {model_save_path}")
    print(f"    - Classes Mapping:         {classes_save_path}")
    print(f"    - Training History:        {history_save_path}")
    print(f"    - Test Metrics:            {metrics_save_path}")
    print(f"    - Confusion Matrix PNG:    {cm_image_path}")
    print("12. Warnings / Errors:         None")
    print("=" * 70)

if __name__ == "__main__":
    main()
