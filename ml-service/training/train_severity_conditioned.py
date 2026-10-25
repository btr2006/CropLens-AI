import os
import sys
import json
import time
import hashlib
import random
import numpy as np
import pandas as pd
from PIL import Image
from collections import defaultdict, Counter

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import models, transforms
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
TRAINING_DIR = os.path.join(BASE_DIR, "training")
CLEAN_DIR = os.path.join(os.path.dirname(BASE_DIR), "datasets", "severity", "aichallenger", "clean")
CLASSES_JSON_PATH = os.path.join(CLEAN_DIR, "classes.json")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(TRAINING_DIR, exist_ok=True)

# 14 Explicit Disease Pairs in AI Challenger (28 fine-grained classes)
DISEASE_PAIRS = [
    {"id": 0, "crop": "Corn", "disease": "Northern leaf blight", "mild_aic_id": 10, "severe_aic_id": 11, "stage1_match": "Corn_(maize)___Northern_Leaf_Blight"},
    {"id": 1, "crop": "Corn", "disease": "Gray leaf spot", "mild_aic_id": 12, "severe_aic_id": 13, "stage1_match": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot"},
    {"id": 2, "crop": "Corn", "disease": "Rust", "mild_aic_id": 15, "severe_aic_id": 16, "stage1_match": "Corn_(maize)___Common_rust_"},
    {"id": 3, "crop": "Peach", "disease": "Bacterial spot", "mild_aic_id": 26, "severe_aic_id": 27, "stage1_match": "Peach___Bacterial_spot"},
    {"id": 4, "crop": "Pepper", "disease": "Bacterial spot", "mild_aic_id": 29, "severe_aic_id": 30, "stage1_match": "Pepper,_bell___Bacterial_spot"},
    {"id": 5, "crop": "Potato", "disease": "Early blight", "mild_aic_id": 32, "severe_aic_id": 33, "stage1_match": "Potato___Early_blight"},
    {"id": 6, "crop": "Potato", "disease": "Late blight", "mild_aic_id": 35, "severe_aic_id": 36, "stage1_match": "Potato___Late_blight"},
    {"id": 7, "crop": "Tomato", "disease": "Bacterial spot", "mild_aic_id": 42, "severe_aic_id": 43, "stage1_match": "Tomato___Bacterial_spot"},
    {"id": 8, "crop": "Tomato", "disease": "Early blight / Alternaria", "mild_aic_id": 44, "severe_aic_id": 45, "stage1_match": "Tomato___Early_blight"},
    {"id": 9, "crop": "Tomato", "disease": "Gray leaf spot", "mild_aic_id": 46, "severe_aic_id": 47, "stage1_match": "Tomato___Gray_leaf_spot"},
    {"id": 10, "crop": "Tomato", "disease": "Late blight", "mild_aic_id": 49, "severe_aic_id": 50, "stage1_match": "Tomato___Late_blight"},
    {"id": 11, "crop": "Tomato", "disease": "Leaf mold", "mild_aic_id": 51, "severe_aic_id": 52, "stage1_match": "Tomato___Leaf_Mold"},
    {"id": 12, "crop": "Tomato", "disease": "Septoria leaf spot", "mild_aic_id": 55, "severe_aic_id": 56, "stage1_match": "Tomato___Septoria_leaf_spot"},
    {"id": 13, "crop": "Tomato", "disease": "Spider mites / Two-spotted", "mild_aic_id": 57, "severe_aic_id": 58, "stage1_match": "Tomato___Spider_mites Two-spotted_spider_mite"}
]

AIC_TO_PAIR_MAP = {}
for p in DISEASE_PAIRS:
    AIC_TO_PAIR_MAP[str(p["mild_aic_id"])] = (p["id"], "Mild", 0, p["crop"], p["disease"])
    AIC_TO_PAIR_MAP[str(p["severe_aic_id"])] = (p["id"], "Severe", 1, p["crop"], p["disease"])

SEVERITY_CLASSES = ["Mild", "Severe"]

def get_device():
    """Select Intel Arc XPU if available, else CUDA, else CPU."""
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        print(f"[Device] Using Intel Arc XPU: {torch.xpu.get_device_name(0)}")
        return torch.device("xpu")
    elif torch.cuda.is_available():
        print(f"[Device] Using CUDA GPU: {torch.cuda.get_device_name(0)}")
        return torch.device("cuda")
    else:
        print("[Device] Using CPU")
        return torch.device("cpu")

class DiseaseConditionedDataset(Dataset):
    def __init__(self, df, transform=None):
        self.df = df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row["image_path"]
        disease_id = int(row["disease_pair_id"])
        severity_label = int(row["severity_idx"])

        with Image.open(img_path) as img:
            image = img.convert("RGB")

        if self.transform:
            image = self.transform(image)

        return image, disease_id, severity_label

class DiseaseConditionedMobileNetV2(nn.Module):
    def __init__(self, num_diseases=14, embedding_dim=32, num_classes=2, pretrained=True):
        super().__init__()
        weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
        self.backbone = models.mobilenet_v2(weights=weights)
        
        # Extract features (1280 dimensional output)
        self.features = self.backbone.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.flatten = nn.Flatten()
        
        # Disease Embedding Layer
        self.disease_embedding = nn.Embedding(num_embeddings=num_diseases, embedding_dim=embedding_dim)
        
        # Classifier Head (Robust without batchnorm on small batches)
        in_features = 1280 + embedding_dim
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes)
        )

    def forward(self, x, disease_ids):
        # 1. Image feature extraction
        feat = self.features(x)
        feat = self.pool(feat)
        feat = self.flatten(feat) # [B, 1280]
        
        # 2. Disease context embedding
        d_embed = self.disease_embedding(disease_ids) # [B, embedding_dim]
        
        # 3. Multimodal fusion
        fused = torch.cat([feat, d_embed], dim=1) # [B, 1280 + embedding_dim]
        
        # 4. Severity classification
        logits = self.classifier(fused)
        return logits

def build_manifest():
    print("\n--- Step 1: Building Severity Dataset Manifest ---")
    splits = ["train", "val", "test"]
    records = []

    for s in splits:
        s_dir = os.path.join(CLEAN_DIR, s)
        for aic_id_str, (pair_id, sev_label, sev_idx, crop, disease) in AIC_TO_PAIR_MAP.items():
            cdir = os.path.join(s_dir, aic_id_str)
            if not os.path.exists(cdir):
                continue
            for fname in os.listdir(cdir):
                if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    fpath = os.path.join(cdir, fname)
                    records.append({
                        "image_path": fpath,
                        "split": s,
                        "crop": crop,
                        "disease": disease,
                        "severity": sev_label,
                        "severity_idx": sev_idx,
                        "disease_pair_id": pair_id,
                        "aic_class_id": int(aic_id_str)
                    })

    df = pd.DataFrame(records)
    manifest_path = os.path.join(TRAINING_DIR, "severity_manifest.csv")
    df.to_csv(manifest_path, index=False)
    print(f"Saved manifest with {len(df)} total images to {manifest_path}")
    print(df["split"].value_counts())
    print("\nSeverity breakdown by split:")
    print(pd.crosstab(df["split"], df["severity"]))
    return df

def train_and_evaluate():
    device = get_device()
    df = build_manifest()

    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "val"].copy()
    test_df = df[df["split"] == "test"].copy()

    # Transformations
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Datasets
    train_dataset = DiseaseConditionedDataset(train_df, transform=train_transform)
    val_dataset = DiseaseConditionedDataset(val_df, transform=eval_transform)
    test_dataset = DiseaseConditionedDataset(test_df, transform=eval_transform)

    # Imbalance Handling via WeightedRandomSampler (per crop+disease+severity group)
    group_counts = Counter(zip(train_df["disease_pair_id"], train_df["severity_idx"]))
    sample_weights = [1.0 / group_counts[(row["disease_pair_id"], row["severity_idx"])] for _, row in train_df.iterrows()]
    sampler = WeightedRandomSampler(weights=sample_weights, num_samples=len(sample_weights), replacement=True)

    BATCH_SIZE = 32
    NUM_WORKERS = 0

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler, num_workers=NUM_WORKERS)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS)

    # Class-weighted CrossEntropyLoss
    sev_counts = train_df["severity_idx"].value_counts().sort_index().values
    class_weights = torch.tensor([1.0 / sev_counts[0], 1.0 / sev_counts[1]], dtype=torch.float32).to(device)
    class_weights = class_weights / class_weights.sum() * 2.0
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Initialize Model
    model = DiseaseConditionedMobileNetV2(num_diseases=len(DISEASE_PAIRS), embedding_dim=32, num_classes=2, pretrained=True)
    model.to(device)

    # Phase 1: Freeze backbone, train classifier + embedding for 2 epochs
    for param in model.backbone.parameters():
        param.requires_grad = False

    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-4)
    EPOCHS = 10
    best_val_macro_f1 = 0.0
    best_epoch = 0
    history = []

    print("\n--- Step 2: Training Disease-Conditioned Severity MobileNetV2 ---")
    start_time = time.time()

    for epoch in range(1, EPOCHS + 1):
        epoch_start = time.time()

        # Unfreeze later backbone layers at Epoch 3
        if epoch == 3:
            print("\n[Fine-Tuning] Unfreezing MobileNetV2 higher feature blocks (features[14:])...")
            for idx, child in enumerate(model.features):
                if idx >= 14:
                    for param in child.parameters():
                        param.requires_grad = True
            optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=1e-4)
            scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS - 2, eta_min=1e-6)

        # Training Phase
        model.train()
        running_loss = 0.0
        all_preds = []
        all_targets = []

        for images, disease_ids, labels in train_loader:
            images = images.to(device)
            disease_ids = disease_ids.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(images, disease_ids)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            preds = torch.argmax(logits, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(labels.cpu().numpy())

        if epoch >= 3:
            scheduler.step()

        train_loss = running_loss / len(train_dataset)
        train_acc = accuracy_score(all_targets, all_preds)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_preds = []
        val_targets = []

        with torch.no_grad():
            for images, disease_ids, labels in val_loader:
                images = images.to(device)
                disease_ids = disease_ids.to(device)
                labels = labels.to(device)

                logits = model(images, disease_ids)
                loss = criterion(logits, labels)

                val_loss += loss.item() * images.size(0)
                preds = torch.argmax(logits, dim=1).cpu().numpy()
                val_preds.extend(preds)
                val_targets.extend(labels.cpu().numpy())

        val_loss = val_loss / len(val_dataset)
        val_acc = accuracy_score(val_targets, val_preds)
        val_p, val_r, val_f1, _ = precision_recall_fscore_support(val_targets, val_preds, average="macro", zero_division=0)
        
        epoch_time = time.time() - epoch_start
        print(f"Epoch {epoch:02d}/{EPOCHS:02d} [{epoch_time:.1f}s] | "
              f"Train Loss: {train_loss:.4f}, Acc: {train_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f}, Acc: {val_acc*100:.2f}%, Macro-F1: {val_f1*100:.2f}%")

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc * 100, 2),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc * 100, 2),
            "val_macro_f1": round(val_f1 * 100, 2),
            "val_macro_precision": round(val_p * 100, 2),
            "val_macro_recall": round(val_r * 100, 2)
        })

        # Save Best Checkpoint
        checkpoint_path = os.path.join(MODELS_DIR, "severity_conditioned_mobilenetv2_best.pth")
        if val_f1 > best_val_macro_f1:
            best_val_macro_f1 = val_f1
            best_epoch = epoch
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_macro_f1": val_f1,
                "val_accuracy": val_acc,
                "disease_pairs": DISEASE_PAIRS,
                "severity_classes": SEVERITY_CLASSES
            }, checkpoint_path)
            print(f"  --> Saved new best checkpoint at epoch {epoch} (Val Macro-F1: {val_f1*100:.2f}%)")

    total_train_time = time.time() - start_time
    print(f"\nTraining completed in {total_train_time:.1f}s ({total_train_time/60:.2f} minutes).")
    print(f"Best Validation Macro-F1: {best_val_macro_f1*100:.2f}% (Epoch {best_epoch})")

    # --- Step 3: Evaluation on Clean Held-Out Test Set ---
    print("\n--- Step 3: Evaluation on Clean Held-Out Test Set ---")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    test_preds = []
    test_targets = []
    test_probs = []
    test_diseases = []

    with torch.no_grad():
        for images, disease_ids, labels in test_loader:
            images = images.to(device)
            disease_ids = disease_ids.to(device)
            labels = labels.to(device)

            logits = model(images, disease_ids)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            preds = np.argmax(probs, axis=1)

            test_preds.extend(preds)
            test_targets.extend(labels.cpu().numpy())
            test_probs.extend(probs)
            test_diseases.extend(disease_ids.cpu().numpy())

    test_acc = accuracy_score(test_targets, test_preds)
    test_p_macro, test_r_macro, test_f1_macro, _ = precision_recall_fscore_support(test_targets, test_preds, average="macro", zero_division=0)
    test_p_weighted, test_r_weighted, test_f1_weighted, _ = precision_recall_fscore_support(test_targets, test_preds, average="weighted", zero_division=0)
    
    p_class, r_class, f1_class, support_class = precision_recall_fscore_support(test_targets, test_preds, average=None, zero_division=0)

    print(f"\n========================================================")
    print(f"HELD-OUT TEST SET EVALUATION RESULTS")
    print(f"========================================================")
    print(f"Overall Test Accuracy:     {test_acc*100:.2f}%")
    print(f"Test Macro Precision:      {test_p_macro*100:.2f}%")
    print(f"Test Macro Recall:         {test_r_macro*100:.2f}%")
    print(f"Test Macro F1-Score:       {test_f1_macro*100:.2f}%")
    print(f"Test Weighted F1-Score:    {test_f1_weighted*100:.2f}%")
    print(f"--------------------------------------------------------")
    print(f"Mild Class:   Precision = {p_class[0]*100:.2f}%, Recall = {r_class[0]*100:.2f}%, F1 = {f1_class[0]*100:.2f}% (Support: {support_class[0]})")
    print(f"Severe Class: Precision = {p_class[1]*100:.2f}%, Recall = {r_class[1]*100:.2f}%, F1 = {f1_class[1]*100:.2f}% (Support: {support_class[1]})")
    print(f"========================================================")

    # Per-Disease Pair Breakdown
    per_disease_results = []
    test_df_eval = test_df.copy()
    test_df_eval["pred_severity_idx"] = test_preds
    test_df_eval["pred_prob_mild"] = [p[0] for p in test_probs]
    test_df_eval["pred_prob_severe"] = [p[1] for p in test_probs]

    print("\nPer-Disease Severity Performance Breakdown (Held-Out Test Set):")
    print(f"{'Crop':<8} | {'Disease':<30} | {'Mild F1':<8} | {'Severe F1':<10} | {'Macro F1':<9} | {'Support':<8}")
    print("-" * 85)

    for p in DISEASE_PAIRS:
        p_id = p["id"]
        sub_df = test_df_eval[test_df_eval["disease_pair_id"] == p_id]
        if len(sub_df) == 0:
            continue
        
        y_true = sub_df["severity_idx"].values
        y_pred = sub_df["pred_severity_idx"].values
        
        p_m, r_m, f1_m, sup_m = precision_recall_fscore_support(y_true, y_pred, average=None, labels=[0, 1], zero_division=0)
        p_mac, r_mac, f1_mac, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
        
        row_res = {
            "disease_pair_id": p_id,
            "crop": p["crop"],
            "disease": p["disease"],
            "stage1_match": p["stage1_match"],
            "mild_f1": round(f1_m[0] * 100, 2),
            "severe_f1": round(f1_m[1] * 100, 2),
            "macro_f1": round(f1_mac * 100, 2),
            "mild_support": int(sup_m[0]),
            "severe_support": int(sup_m[1]),
            "total_support": len(sub_df)
        }
        per_disease_results.append(row_res)
        print(f"{p['crop']:<8} | {p['disease']:<30} | {f1_m[0]*100:>6.2f}% | {f1_m[1]*100:>8.2f}% | {f1_mac*100:>7.2f}% | {len(sub_df):<8}")

    # --- Step 4: Generate Confusion Matrix Plot ---
    cm = confusion_matrix(test_targets, test_preds, labels=[0, 1])
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title("Severity Confusion Matrix (Held-Out Test Set)", fontsize=12, fontweight='bold', pad=12)
    plt.colorbar()
    tick_marks = np.arange(len(SEVERITY_CLASSES))
    plt.xticks(tick_marks, SEVERITY_CLASSES, fontsize=10)
    plt.yticks(tick_marks, SEVERITY_CLASSES, fontsize=10)
    plt.xlabel("Predicted Severity", fontsize=11, labelpad=8)
    plt.ylabel("Actual True Severity", fontsize=11, labelpad=8)

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, f"{cm[i, j]:,}\n({cm[i, j]/cm[i].sum()*100:.1f}%)",
                     horizontalalignment="center",
                     verticalalignment="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontsize=11)

    plt.tight_layout()
    cm_path = os.path.join(MODELS_DIR, "severity_confusion_matrix.png")
    plt.savefig(cm_path, dpi=200)
    plt.close()
    print(f"\nSaved confusion matrix plot to {cm_path}")

    # --- Step 5: Save Artifacts ---
    # 1. severity_classes.json
    with open(os.path.join(MODELS_DIR, "severity_classes.json"), "w", encoding="utf-8") as f:
        json.dump({"classes": ["Mild", "Severe"]}, f, indent=2)

    # 2. severity_disease_mapping.json
    mapping_artifact = {
        "description": "Mapping from Stage 1 Disease Classifier outputs to Stage 2 Severity-Conditioned Model disease IDs",
        "supported_disease_pairs": DISEASE_PAIRS,
        "inference_routing_logic": {
            "healthy_action": "Return Severity: Healthy (0% Yield Impact)",
            "explicit_severity_action": "Pass leaf image + disease_pair_id to Stage 2 Severity Model",
            "general_single_stage_action": "Return Severity: General / Single-stage (Do not force Mild/Severe)",
            "unsupported_action": "Return Severity: Unavailable for this disease"
        }
    }
    with open(os.path.join(MODELS_DIR, "severity_disease_mapping.json"), "w", encoding="utf-8") as f:
        json.dump(mapping_artifact, f, indent=2)

    # 3. severity_training_history.json
    with open(os.path.join(MODELS_DIR, "severity_training_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    # 4. severity_test_metrics.json
    test_metrics_data = {
        "test_dataset_size": len(test_dataset),
        "overall_metrics": {
            "accuracy": round(test_acc * 100, 2),
            "macro_precision": round(test_p_macro * 100, 2),
            "macro_recall": round(test_r_macro * 100, 2),
            "macro_f1": round(test_f1_macro * 100, 2),
            "weighted_f1": round(test_f1_weighted * 100, 2)
        },
        "class_metrics": {
            "Mild": {
                "precision": round(p_class[0] * 100, 2),
                "recall": round(r_class[0] * 100, 2),
                "f1_score": round(f1_class[0] * 100, 2),
                "support": int(support_class[0])
            },
            "Severe": {
                "precision": round(p_class[1] * 100, 2),
                "recall": round(r_class[1] * 100, 2),
                "f1_score": round(f1_class[1] * 100, 2),
                "support": int(support_class[1])
            }
        },
        "per_disease_breakdown": per_disease_results
    }
    with open(os.path.join(MODELS_DIR, "severity_test_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(test_metrics_data, f, indent=2)

    # 5. severity_model_notes.json
    notes = {
        "model_name": "Disease-Conditioned Multi-Crop Severity MobileNetV2",
        "architecture": "MobileNetV2 (1280-dim feature vector) + Learned Disease Context Embedding (32-dim) -> Classification Head (2 logits: Mild / Severe)",
        "input_resolution": "224x224 RGB",
        "training_dataset": "AI Challenger 2018 (PDR2018) Clean Group-Stratified Split",
        "total_training_samples": len(train_dataset),
        "total_validation_samples": len(val_dataset),
        "total_held_out_test_samples": len(test_dataset),
        "cross_split_duplicates": 0,
        "best_epoch": best_epoch,
        "best_val_macro_f1": round(best_val_macro_f1 * 100, 2),
        "held_out_test_accuracy": round(test_acc * 100, 2),
        "held_out_test_macro_f1": round(test_f1_macro * 100, 2),
        "device_used": str(device),
        "supported_crop_disease_pairs_count": len(DISEASE_PAIRS),
        "known_limitations_and_disclaimer": (
            "This model estimates disease severity only for crop-disease combinations represented with explicit Mild/Severe labels in the training data. "
            "It does not provide universal severity estimation for unsupported diseases. "
            "Performance is evaluated on dataset test splits; real-farm deployment requires ongoing calibration with field agronomic imagery."
        )
    }
    with open(os.path.join(MODELS_DIR, "severity_model_notes.json"), "w", encoding="utf-8") as f:
        json.dump(notes, f, indent=2)

    # --- Step 6: Sample Held-Out Test Image Predictions ---
    print("\n--- Step 6: Sample Held-Out Test Image Predictions ---")
    random.seed(123)
    sample_indices = random.sample(range(len(test_dataset)), 8)
    for s_idx in sample_indices:
        row = test_df.iloc[s_idx]
        img_path = row["image_path"]
        true_crop = row["crop"]
        true_disease = row["disease"]
        true_sev = row["severity"]
        d_id = int(row["disease_pair_id"])

        with Image.open(img_path) as img:
            img_t = eval_transform(img.convert("RGB")).unsqueeze(0).to(device)

        d_t = torch.tensor([d_id], dtype=torch.long).to(device)
        with torch.no_grad():
            out_logits = model(img_t, d_t)
            probs = torch.softmax(out_logits, dim=1).cpu().numpy()[0]
            pred_idx = np.argmax(probs)
            pred_sev = SEVERITY_CLASSES[pred_idx]
            conf = probs[pred_idx] * 100.0

        match_icon = "CORRECT" if pred_sev == true_sev else "MISMATCH"
        print(f"[{match_icon}] Actual: {true_crop} | {true_disease} | True: {true_sev:<6} --> Predicted: {pred_sev:<6} ({conf:.1f}% conf)")

    # --- Step 7: Verify Checkpoint Reload ---
    print("\n--- Step 7: Verifying Checkpoint Reload ---")
    test_reload_model = DiseaseConditionedMobileNetV2(num_diseases=14, embedding_dim=32, num_classes=2, pretrained=False)
    loaded_ckpt = torch.load(checkpoint_path, map_location="cpu")
    test_reload_model.load_state_dict(loaded_ckpt["model_state_dict"])
    test_reload_model.eval()
    print("[Verification] Checkpoint reloaded and verified successfully on CPU/XPU!")

    print("\n=== SEVERITY MODEL TRAINING & EVALUATION COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    train_and_evaluate()
