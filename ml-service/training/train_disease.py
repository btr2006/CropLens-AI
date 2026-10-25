import os
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import torchvision
from torchvision import datasets, transforms, models

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
    """Run validation over the validation dataset."""
    model.eval()
    running_loss = 0.0
    correct_preds = 0
    total_samples = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_preds += torch.sum(preds == labels.data).item()
            total_samples += images.size(0)

    epoch_loss = running_loss / total_samples
    epoch_acc = correct_preds / total_samples
    return epoch_loss, epoch_acc

def main():
    print("=" * 70)
    print("CropGuard AI - MobileNetV2 Plant Disease Transfer Learning Baseline")
    print("=" * 70)

    # 1. Device selection
    device = get_device()

    # 2. Path configuration
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    train_dir = os.path.join(
        project_root,
        "datasets",
        "disease",
        "New Plant Diseases Dataset(Augmented)",
        "New Plant Diseases Dataset(Augmented)",
        "train"
    )
    valid_dir = os.path.join(
        project_root,
        "datasets",
        "disease",
        "New Plant Diseases Dataset(Augmented)",
        "New Plant Diseases Dataset(Augmented)",
        "valid"
    )

    models_dir = os.path.join(project_root, "ml-service", "models")
    os.makedirs(models_dir, exist_ok=True)

    model_save_path = os.path.join(models_dir, "disease_mobilenetv2_best.pth")
    classes_save_path = os.path.join(models_dir, "disease_classes.json")
    history_save_path = os.path.join(models_dir, "disease_training_history.json")

    print(f"\n[1] Resolving Paths:")
    print(f"    Train dataset:          {train_dir}")
    print(f"    Valid dataset:          {valid_dir}")
    print(f"    Target model path:      {model_save_path}")
    print(f"    Target classes path:    {classes_save_path}")
    print(f"    Target history path:    {history_save_path}")

    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Training dataset directory not found at: {train_dir}")
    if not os.path.exists(valid_dir):
        raise FileNotFoundError(f"Validation dataset directory not found at: {valid_dir}")

    # 3. Data Transforms
    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ]),
        'valid': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    }

    # 4. Data Loaders
    print("\n[2] Loading datasets with ImageFolder...")
    train_dataset = datasets.ImageFolder(root=train_dir, transform=data_transforms['train'])
    valid_dataset = datasets.ImageFolder(root=valid_dir, transform=data_transforms['valid'])

    num_classes = len(train_dataset.classes)
    print(f"    Number of classes:   {num_classes}")
    print(f"    Training samples:     {len(train_dataset)}")
    print(f"    Validation samples:   {len(valid_dataset)}")

    batch_size = 16
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    valid_loader = DataLoader(valid_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # 5. Export class mapping JSON
    print(f"\n[3] Exporting class mapping to {classes_save_path}...")
    class_mapping = {
        "classes": train_dataset.classes,
        "class_to_idx": train_dataset.class_to_idx,
        "idx_to_class": {idx: cls_name for cls_name, idx in train_dataset.class_to_idx.items()}
    }
    with open(classes_save_path, "w", encoding="utf-8") as f:
        json.dump(class_mapping, f, indent=2)

    # 6. Model Initialization & Transfer Learning Setup
    print("\n[4] Initializing MobileNetV2 with ImageNet pretrained weights...")
    try:
        weights = models.MobileNet_V2_Weights.DEFAULT
        model = models.mobilenet_v2(weights=weights)
    except AttributeError:
        model = models.mobilenet_v2(pretrained=True)

    # Freeze feature extractor layers
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace final classifier layer for 38 target classes
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)

    model = model.to(device)

    # 7. Optimizer and Loss Function (Only optimizing classifier parameters)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=0.001)

    # 8. Training loop (5 baseline epochs)
    epochs = 5
    best_val_acc = 0.0
    history = {
        "epochs": epochs,
        "batch_size": batch_size,
        "learning_rate": 0.001,
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": []
    }

    print("\n[5] Starting Transfer Learning (Classifier Head Only)...")
    print(f"    Target Epochs: {epochs} (Baseline run)")
    print("-" * 70)

    for epoch in range(epochs):
        start_time = time.time()

        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate_epoch(model, valid_loader, criterion, device)

        elapsed = time.time() - start_time

        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 4))

        print(
            f"Epoch [{epoch+1}/{epochs}] ({elapsed:.1f}s) | "
            f"Train Loss: {train_loss:.4f} - Train Acc: {train_acc*100:.2f}% | "
            f"Val Loss: {val_loss:.4f} - Val Acc: {val_acc*100:.2f}%"
        )

        # Save model if validation accuracy improves
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            print(f"    --> Validation accuracy improved to {val_acc*100:.2f}%. Saving checkpoint...")
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'best_val_acc': best_val_acc,
                'num_classes': num_classes,
                'class_to_idx': train_dataset.class_to_idx,
                'classes': train_dataset.classes,
                'architecture': 'mobilenet_v2'
            }, model_save_path)

    # 9. Save Training History JSON
    print(f"\n[6] Exporting training history to {history_save_path}...")
    with open(history_save_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print("\n" + "=" * 70)
    print("TRAINING COMPLETED (BASELINE 5 EPOCHS)")
    print("=" * 70)
    print(f"  Best Validation Accuracy: {best_val_acc * 100:.2f}%")
    print(f"  Saved Model Checkpoint: {model_save_path}")
    print(f"  Saved Class Mapping: {classes_save_path}")
    print(f"  Saved Training History: {history_save_path}")
    print("=" * 70)

if __name__ == "__main__":
    main()

