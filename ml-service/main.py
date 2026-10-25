import os
import io
import time
import json
import asyncio
import joblib
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, ImageStat
import pandas as pd
from pydantic import BaseModel
from typing import Optional, Dict, Any, Tuple, Generator, AsyncGenerator
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from risk_fusion import fuse_crop_health_risk

# Global variables for loaded models and artifacts
yield_model = None
yield_features = None

leaf_gate_model = None
leaf_gate_classes = None
leaf_gate_device = None
leaf_gate_transform = None
leaf_gate_threshold = 0.90

disease_model = None
disease_classes = None
disease_device = None
disease_transform = None

severity_model = None
severity_classes = None
severity_device = None
severity_transform = None
severity_disease_mapping = None

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def check_image_quality(pil_img: Image.Image) -> Tuple[bool, Optional[str]]:
    """
    Practical image quality checks:
    - Minimum resolution (width >= 64, height >= 64)
    - Extreme brightness / darkness
    """
    w, h = pil_img.size
    if w < 64 or h < 64:
        return False, f"Image resolution ({w}x{h}) is too low for reliable analysis. Minimum required is 64x64 pixels."
    
    gray = pil_img.convert("L")
    stat = ImageStat.Stat(gray)
    mean_brightness = stat.mean[0]
    
    if mean_brightness < 12.0:
        return False, "Image appears completely dark or underexposed. Please capture with better lighting."
    if mean_brightness > 248.0:
        return False, "Image appears completely white or overexposed. Please capture with balanced lighting."
        
    return True, None

# Single-stage disease list for explicit non-graded routing (Case C)
SINGLE_STAGE_DISEASES = {
    "Apple___Apple_scab",
    "Apple___Cedar_apple_rust",
    "Cherry_(including_sour)___Powdery_mildew",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Strawberry___Leaf_scorch",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus"
}

def get_device():
    """Detect Intel Arc XPU if available, otherwise fallback to CPU."""
    if hasattr(torch, "xpu") and torch.xpu.is_available():
        print(f"[ML Service] Device selected: Intel Arc XPU ({torch.xpu.get_device_name(0)})")
        return torch.device("xpu")
    elif torch.cuda.is_available():
        print(f"[ML Service] Device selected: CUDA GPU ({torch.cuda.get_device_name(0)})")
        return torch.device("cuda")
    print("[ML Service] Device selected: CPU")
    return torch.device("cpu")

class DiseaseConditionedMobileNetV2(nn.Module):
    """
    Stage 2 Multimodal Severity Model:
    Extracts 1280-dim image feature vector from MobileNetV2,
    concatenates with a 32-dim learned disease embedding,
    and classifies into [Mild, Severe].
    """
    def __init__(self, num_diseases=14, embedding_dim=32, num_classes=2, pretrained=False):
        super().__init__()
        weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
        self.backbone = models.mobilenet_v2(weights=weights)
        self.features = self.backbone.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.flatten = nn.Flatten()
        
        self.disease_embedding = nn.Embedding(num_embeddings=num_diseases, embedding_dim=embedding_dim)
        
        in_features = 1280 + embedding_dim
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes)
        )

    def forward(self, x, disease_ids):
        feat = self.features(x)
        feat = self.pool(feat)
        feat = self.flatten(feat)
        d_embed = self.disease_embedding(disease_ids)
        fused = torch.cat([feat, d_embed], dim=1)
        logits = self.classifier(fused)
        return logits

def parse_class_name(raw_class: str) -> Tuple[str, str]:
    """Convert dataset class format (e.g., Tomato___Early_blight) to readable crop and disease names."""
    if "___" in raw_class:
        parts = raw_class.split("___", 1)
        crop_raw = parts[0].replace("_", " ").strip()
        disease_raw = parts[1].replace("_", " ").strip()

        crop = " ".join(crop_raw.split())
        disease = " ".join(disease_raw.split())

        if disease.lower() == "healthy":
            disease = "Healthy"
        else:
            disease = disease.title()
    else:
        crop = "Unknown"
        disease = raw_class.replace("_", " ").strip().title()

    return crop, disease

def get_severity_routing(raw_class: str, disease_name: str) -> Dict[str, Any]:
    """
    Evaluate routing rule for Stage 2 severity model:
    - CASE A: Healthy
    - CASE B: Explicit Mild/Severe (14 pairs)
    - CASE C: General / Single-stage
    - CASE D: No severity mapping / Unavailable
    """
    is_healthy = (disease_name.strip().lower() == "healthy" or raw_class.lower().endswith("___healthy"))
    if is_healthy:
        return {
            "case": "A",
            "severity_status": "healthy",
            "severity": "Healthy",
            "severity_confidence": None,
            "severity_model_supported": False,
            "severity_explanation": "Crop is diagnosed as healthy; no disease severity progression.",
            "disease_pair_id": None
        }

    # Check Case B: Supported explicit Mild/Severe disease pairs
    if severity_disease_mapping and "supported_disease_pairs" in severity_disease_mapping:
        for pair in severity_disease_mapping["supported_disease_pairs"]:
            if pair.get("stage1_match") == raw_class:
                return {
                    "case": "B",
                    "severity_status": "graded",
                    "severity": None,
                    "severity_confidence": None,
                    "severity_model_supported": True,
                    "severity_explanation": "Disease supports explicit Mild/Severe severity grading.",
                    "disease_pair_id": pair["id"]
                }

    # Check Case C: Single-stage diseases
    if raw_class in SINGLE_STAGE_DISEASES:
        return {
            "case": "C",
            "severity_status": "not_explicitly_graded",
            "severity": "General / Single-stage",
            "severity_confidence": None,
            "severity_model_supported": False,
            "severity_explanation": "The source training data provides disease presence but does not provide Mild/Severe grading for this disease.",
            "disease_pair_id": None
        }

    # Check Case D: No mapping
    return {
        "case": "D",
        "severity_status": "unavailable",
        "severity": None,
        "severity_confidence": None,
        "severity_model_supported": False,
        "severity_explanation": "Severity model is unavailable for this specific crop and disease.",
        "disease_pair_id": None
    }

def normalize_crop(name: str) -> str:
    name_clean = name.lower()
    for token in ["(solanum lycopersicum)", "(solanum tuberosum)", "(capsicum annuum)", "(zea mays)", "(coffee arabica)", "(malus domestica)"]:
        name_clean = name_clean.replace(token, "")
    name_clean = name_clean.strip()
    if "corn" in name_clean or "maize" in name_clean:
        return "corn"
    if "pepper" in name_clean:
        return "bell pepper"
    return name_clean

def run_crop_health_pipeline(
    pil_img: Image.Image,
    img_meta: Dict[str, Any],
    fertilizer: float,
    temp: float,
    n: float,
    p: float,
    k: float,
    selected_crop: Optional[str] = None
) -> Generator[Dict[str, Any], None, Dict[str, Any]]:
    """
    Unified core crop health ML pipeline generator.
    Emits real stage events and yields the final report without duplicate model calls.
    """
    total_start = time.perf_counter()
    timings = {}

    # --- STAGE 1: Image Validation & Quality Checks ---
    t_val0 = time.perf_counter()
    w, h = pil_img.size
    img_format = pil_img.format or "JPEG"
    mode = pil_img.mode
    val_time = (time.perf_counter() - t_val0) * 1000.0

    quality_ok, quality_err = check_image_quality(pil_img)
    if not quality_ok:
        quality_fail_payload = {
            "image_valid": False,
            "leaf_detected": False,
            "is_leaf": False,
            "leaf_confidence": 0.0,
            "image_rejection_reason": quality_err,
            "timings_ms": {"image_validation_ms": round(val_time, 2)}
        }
        yield {
            "stage": "image_validation",
            "status": "rejected",
            "details": quality_fail_payload
        }
        return quality_fail_payload

    yield {
        "stage": "image_validation",
        "status": "complete",
        "details": {
            "format": img_format,
            "width": w,
            "height": h,
            "mode": mode,
            "filename": img_meta.get("filename", "leaf_upload.jpg"),
            "size_bytes": img_meta.get("size_bytes", 0),
            "timing_ms": round(val_time, 2)
        }
    }

    # --- STAGE 2: Leaf / Non-Leaf Validation Gate (MobileNetV2 Binary Gate) ---
    t_gate0 = time.perf_counter()
    tensor_gate = leaf_gate_transform(pil_img).unsqueeze(0).to(leaf_gate_device)
    with torch.no_grad():
        gate_out = leaf_gate_model(tensor_gate)
        gate_probs = torch.softmax(gate_out, dim=1)[0]
        prob_non_leaf = float(gate_probs[0].item())
        prob_valid_leaf = float(gate_probs[1].item())

    timings["leaf_gate_ms"] = round((time.perf_counter() - t_gate0) * 1000.0, 2)
    is_leaf = (prob_valid_leaf >= leaf_gate_threshold)

    if not is_leaf:
        non_leaf_conf = round(prob_non_leaf * 100, 2)
        rejection_payload = {
            "image_valid": False,
            "leaf_detected": False,
            "is_leaf": False,
            "leaf_confidence": non_leaf_conf,
            "image_rejection_reason": "Uploaded image does not appear to contain a suitable plant leaf for crop-health analysis.",
            "timings_ms": timings
        }
        yield {
            "stage": "leaf_validation",
            "status": "rejected",
            "details": rejection_payload
        }
        # STOP immediately. Do NOT call disease, severity, yield, risk fusion, Gemini, or voice.
        return rejection_payload

    leaf_conf = round(prob_valid_leaf * 100, 2)
    yield {
        "stage": "leaf_validation",
        "status": "complete",
        "details": {
            "is_leaf": True,
            "leaf_detected": True,
            "image_valid": True,
            "leaf_confidence": leaf_conf,
            "threshold": leaf_gate_threshold,
            "timing_ms": timings["leaf_gate_ms"]
        }
    }

    # --- STAGE 3: Crop + Disease Analysis (MobileNetV2 38 Classes) ---
    t_d0 = time.perf_counter()
    tensor_d = disease_transform(pil_img).unsqueeze(0).to(disease_device)
    with torch.no_grad():
        d_outputs = disease_model(tensor_d)
        d_probs = torch.softmax(d_outputs, dim=1)[0]
        d_conf_val, d_pred_idx = torch.max(d_probs, dim=0)

    d_idx = d_pred_idx.item()
    disease_conf = round(float(d_conf_val.item()) * 100, 2)
    raw_class = disease_classes[d_idx] if d_idx < len(disease_classes) else f"Class_{d_idx}"
    predicted_crop, disease_name = parse_class_name(raw_class)
    timings["disease_inference_ms"] = round((time.perf_counter() - t_d0) * 1000.0, 2)

    # Top candidates
    top_k = min(3, len(disease_classes))
    top_vals, top_indices = torch.topk(d_probs, k=top_k)
    top_candidates = []
    for tv, ti in zip(top_vals, top_indices):
        c_raw = disease_classes[ti.item()]
        c_crop, c_dis = parse_class_name(c_raw)
        top_candidates.append({
            "crop": c_crop,
            "disease": c_dis,
            "confidence": round(float(tv.item()) * 100, 2)
        })

    yield {
        "stage": "disease_analysis",
        "status": "complete",
        "details": {
            "crop": predicted_crop,
            "disease": disease_name,
            "confidence": disease_conf,
            "raw_class": raw_class,
            "top_candidates": top_candidates,
            "timing_ms": timings["disease_inference_ms"]
        }
    }

    # --- CROP MISMATCH CHECK ---
    sel_crop_clean = (selected_crop or "").strip()
    if sel_crop_clean and sel_crop_clean.lower() not in ["auto-detect", "auto detect", ""]:
        norm_selected = normalize_crop(sel_crop_clean)
        norm_predicted = normalize_crop(predicted_crop)

        if norm_selected != norm_predicted:
            mismatch_payload = {
                "crop_mismatch": True,
                "selected_crop": sel_crop_clean,
                "predicted_crop": predicted_crop,
                "disease": disease_name,
                "disease_confidence": disease_conf,
                "message": f"The uploaded leaf image appears to be {predicted_crop}, but you selected {sel_crop_clean}. Please select {predicted_crop} or upload a {sel_crop_clean} leaf image."
            }
            yield {
                "stage": "crop_mismatch",
                "status": "mismatch_detected",
                "details": mismatch_payload
            }
            return mismatch_payload

    # --- STAGE 3: Severity Assessment (Disease-Conditioned Model) ---
    t_s0 = time.perf_counter()
    routing = get_severity_routing(raw_class, disease_name)

    if routing["case"] == "B":
        d_pair_id = routing["disease_pair_id"]
        tensor_s = severity_transform(pil_img).unsqueeze(0).to(severity_device)
        d_pair_tensor = torch.tensor([d_pair_id], dtype=torch.long).to(severity_device)

        with torch.no_grad():
            s_logits = severity_model(tensor_s, d_pair_tensor)
            s_probs = torch.softmax(s_logits, dim=1)[0]
            s_conf_val, s_pred_idx = torch.max(s_probs, dim=0)

        s_idx = s_pred_idx.item()
        pred_sev = severity_classes[s_idx] if s_idx < len(severity_classes) else ("Mild" if s_idx == 0 else "Severe")
        sev_conf = round(float(s_conf_val.item()) * 100, 2)

        routing["severity"] = pred_sev
        routing["severity_confidence"] = sev_conf

    timings["severity_inference_ms"] = round((time.perf_counter() - t_s0) * 1000.0, 2)

    yield {
        "stage": "severity_assessment",
        "status": "complete",
        "details": {
            "severity": routing["severity"],
            "severity_confidence": routing["severity_confidence"],
            "severity_model_supported": routing["severity_model_supported"],
            "severity_status": routing["severity_status"],
            "severity_explanation": routing["severity_explanation"],
            "timing_ms": timings["severity_inference_ms"]
        }
    }

    # --- STAGE 4: Yield Prediction (Random Forest Model) ---
    t_y0 = time.perf_counter()
    ordered_values = [fertilizer, temp, n, p, k]
    input_df = pd.DataFrame([ordered_values], columns=yield_features)
    pred_yield_val = round(float(yield_model.predict(input_df)[0]), 2)
    timings["yield_inference_ms"] = round((time.perf_counter() - t_y0) * 1000.0, 2)

    yield {
        "stage": "yield_prediction",
        "status": "complete",
        "details": {
            "predicted_yield": pred_yield_val,
            "input_features": {
                "Fertilizer": fertilizer,
                "temp": temp,
                "N": n,
                "P": p,
                "K": k
            },
            "timing_ms": timings["yield_inference_ms"]
        }
    }

    # --- STAGE 5: Risk Fusion ---
    t_f0 = time.perf_counter()
    disease_res = {
        "crop": predicted_crop,
        "disease": disease_name,
        "confidence": disease_conf,
        "raw_class": raw_class
    }
    yield_res = {
        "predicted_yield": pred_yield_val
    }

    final_report = fuse_crop_health_risk(
        disease_res=disease_res,
        severity_block=routing,
        yield_res=yield_res,
        timings_ms=timings
    )
    timings["risk_fusion_ms"] = round((time.perf_counter() - t_f0) * 1000.0, 2)
    timings["total_ms"] = round((time.perf_counter() - total_start) * 1000.0, 2)
    final_report["timings_ms"] = timings
    final_report["image_valid"] = True
    final_report["leaf_detected"] = True
    final_report["leaf_confidence"] = leaf_conf
    final_report["image_rejection_reason"] = None

    yield {
        "stage": "risk_fusion",
        "status": "complete",
        "details": {
            "overall_risk": final_report["overall_risk"],
            "yield_risk": final_report["yield_risk"],
            "warnings": final_report["warnings"],
            "timing_ms": timings["risk_fusion_ms"]
        }
    }

    # --- STAGE 7: Analysis Complete ---
    yield {
        "stage": "analysis_complete",
        "status": "complete",
        "details": final_report
    }

    return final_report

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager for initializing ML model artifacts at startup."""
    global yield_model, yield_features
    global leaf_gate_model, leaf_gate_classes, leaf_gate_device, leaf_gate_transform, leaf_gate_threshold
    global disease_model, disease_classes, disease_device, disease_transform
    global severity_model, severity_classes, severity_device, severity_transform, severity_disease_mapping

    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")

    # 1. Load Yield Model Artifacts
    yield_model_path = os.path.join(models_dir, "yield_model.pkl")
    yield_features_path = os.path.join(models_dir, "yield_features.json")

    if not os.path.exists(yield_model_path):
        raise RuntimeError(f"[Startup Error] Yield model missing at: {yield_model_path}")
    if not os.path.exists(yield_features_path):
        raise RuntimeError(f"[Startup Error] Yield features JSON missing at: {yield_features_path}")

    yield_model = joblib.load(yield_model_path)
    with open(yield_features_path, "r", encoding="utf-8") as f:
        yield_features = json.load(f)
    print("[ML Service] Loaded Yield Prediction model successfully.")

    # 2. Load Leaf Gate MobileNetV2 Model Artifacts (Input Validation Gate)
    leaf_gate_model_path = os.path.join(models_dir, "leaf_gate_mobilenetv2_best.pth")
    leaf_gate_classes_path = os.path.join(models_dir, "leaf_gate_classes.json")

    if not os.path.exists(leaf_gate_model_path):
        raise RuntimeError(f"[Startup Error] Leaf gate model checkpoint missing at: {leaf_gate_model_path}")
    if not os.path.exists(leaf_gate_classes_path):
        raise RuntimeError(f"[Startup Error] Leaf gate classes JSON missing at: {leaf_gate_classes_path}")

    with open(leaf_gate_classes_path, "r", encoding="utf-8") as f:
        lg_data = json.load(f)
        leaf_gate_classes = lg_data.get("classes", ["non_leaf", "valid_leaf"])

    leaf_gate_device = get_device()
    lg_model = models.mobilenet_v2(weights=None)
    in_features = lg_model.classifier[1].in_features
    lg_model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 2)
    )

    lg_checkpoint = torch.load(leaf_gate_model_path, map_location=leaf_gate_device)
    if isinstance(lg_checkpoint, dict) and "model_state_dict" in lg_checkpoint:
        lg_model.load_state_dict(lg_checkpoint["model_state_dict"])
        leaf_gate_threshold = float(lg_checkpoint.get("operating_threshold", 0.90))
    else:
        lg_model.load_state_dict(lg_checkpoint)
        leaf_gate_threshold = 0.90

    lg_model.to(leaf_gate_device)
    lg_model.eval()
    leaf_gate_model = lg_model

    leaf_gate_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    print(f"[ML Service] Loaded Leaf Gate MobileNetV2 Model (Threshold={leaf_gate_threshold}) successfully.")

    # 3. Load Plant Disease MobileNetV2 Model Artifacts (Stage 1)
    disease_model_path = os.path.join(models_dir, "disease_mobilenetv2_best.pth")
    disease_classes_path = os.path.join(models_dir, "disease_classes.json")

    if not os.path.exists(disease_model_path):
        raise RuntimeError(f"[Startup Error] Disease model checkpoint missing at: {disease_model_path}")
    if not os.path.exists(disease_classes_path):
        raise RuntimeError(f"[Startup Error] Disease classes JSON missing at: {disease_classes_path}")

    with open(disease_classes_path, "r", encoding="utf-8") as f:
        class_data = json.load(f)
        disease_classes = class_data.get("classes", [])

    num_classes = len(disease_classes) if disease_classes else 38
    disease_device = get_device()

    try:
        weights = None
        model = models.mobilenet_v2(weights=weights)
    except AttributeError:
        model = models.mobilenet_v2(pretrained=False)

    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)

    checkpoint = torch.load(disease_model_path, map_location=disease_device)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.to(disease_device)
    model.eval()
    disease_model = model

    disease_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    print(f"[ML Service] Loaded Stage 1 MobileNetV2 Disease Classifier ({num_classes} classes) successfully.")

    # 3. Load Disease-Conditioned Severity MobileNetV2 Model Artifacts (Stage 2)
    severity_model_path = os.path.join(models_dir, "severity_conditioned_mobilenetv2_best.pth")
    severity_classes_path = os.path.join(models_dir, "severity_classes.json")
    severity_mapping_path = os.path.join(models_dir, "severity_disease_mapping.json")

    if not os.path.exists(severity_model_path):
        raise RuntimeError(f"[Startup Error] Severity model checkpoint missing at: {severity_model_path}")
    if not os.path.exists(severity_classes_path):
        raise RuntimeError(f"[Startup Error] Severity classes JSON missing at: {severity_classes_path}")
    if not os.path.exists(severity_mapping_path):
        raise RuntimeError(f"[Startup Error] Severity mapping JSON missing at: {severity_mapping_path}")

    with open(severity_classes_path, "r", encoding="utf-8") as f:
        sev_class_data = json.load(f)
        severity_classes = sev_class_data.get("classes", ["Mild", "Severe"])

    with open(severity_mapping_path, "r", encoding="utf-8") as f:
        severity_disease_mapping = json.load(f)

    severity_device = get_device()

    num_diseases = len(severity_disease_mapping.get("supported_disease_pairs", [])) or 14
    sev_model = DiseaseConditionedMobileNetV2(
        num_diseases=num_diseases,
        embedding_dim=32,
        num_classes=len(severity_classes),
        pretrained=False
    )

    sev_checkpoint = torch.load(severity_model_path, map_location=severity_device)
    if isinstance(sev_checkpoint, dict) and "model_state_dict" in sev_checkpoint:
        sev_model.load_state_dict(sev_checkpoint["model_state_dict"])
    else:
        sev_model.load_state_dict(sev_checkpoint)

    sev_model.to(severity_device)
    sev_model.eval()
    severity_model = sev_model

    severity_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    print(f"[ML Service] Loaded Stage 2 Disease-Conditioned Severity Model (14 disease pairs, {len(severity_classes)} classes) successfully.")
    yield

# Initialize FastAPI app
app = FastAPI(
    title="CropGuard AI - ML Service",
    description="Backend ML service for CropGuard AI Decision Support Platform",
    version="2.0.0",
    lifespan=lifespan
)

# Default allowed origins for local development
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Read optional comma-separated production origins from environment (e.g., FRONTEND_ORIGINS="https://your-croplens.vercel.app")
env_origins = os.environ.get("FRONTEND_ORIGINS", "")
if env_origins:
    additional_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
    origins = list(dict.fromkeys(default_origins + additional_origins))
else:
    origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class YieldInput(BaseModel):
    Fertilizer: float
    temp: float
    N: float
    P: float
    K: float

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "cropguard-ml",
        "leaf_gate_model_loaded": leaf_gate_model is not None,
        "leaf_gate_operating_threshold": leaf_gate_threshold,
        "disease_model_loaded": disease_model is not None,
        "yield_model_loaded": yield_model is not None,
        "severity_model_loaded": severity_model is not None,
        "severity_model_name": "DiseaseConditionedMobileNetV2 (AI Challenger PDR2018 Clean Split)",
        "hardware_device": str(disease_device)
    }

@app.post("/predict/yield")
def predict_yield(payload: YieldInput):
    if yield_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Yield model is not loaded."
        )
    t0 = time.perf_counter()
    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    ordered_values = [data[feat] for feat in yield_features]
    input_df = pd.DataFrame([ordered_values], columns=yield_features)

    prediction = yield_model.predict(input_df)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return {
        "predicted_yield": round(float(prediction[0]), 2),
        "inference_time_ms": round(elapsed_ms, 2)
    }

@app.post("/predict/disease")
async def predict_disease(file: UploadFile = File(...)):
    if disease_model is None or disease_classes is None or disease_transform is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Disease model is not loaded."
        )

    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
        )

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image."
        )

    t0 = time.perf_counter()

    # Leaf Gate semantic check if loaded
    if leaf_gate_model is not None and leaf_gate_transform is not None:
        tensor_gate = leaf_gate_transform(image).unsqueeze(0).to(leaf_gate_device)
        with torch.no_grad():
            gate_out = leaf_gate_model(tensor_gate)
            gate_probs = torch.softmax(gate_out, dim=1)[0]
            prob_non = float(gate_probs[0].item())
            prob_leaf = float(gate_probs[1].item())
        if prob_leaf < leaf_gate_threshold:
            return {
                "crop": "Unidentified / Non-Crop",
                "disease": "Non-Leaf Specimen",
                "confidence": round(prob_non * 100, 2),
                "is_leaf": False,
                "image_valid": False,
                "image_rejection_reason": "Uploaded image does not appear to contain a suitable plant leaf for crop-health analysis.",
                "inference_time_ms": round((time.perf_counter() - t0) * 1000.0, 2)
            }

    tensor = disease_transform(image).unsqueeze(0).to(disease_device)

    with torch.no_grad():
        outputs = disease_model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        confidence_val, pred_idx = torch.max(probabilities, dim=0)

    idx = pred_idx.item()
    confidence_pct = round(float(confidence_val.item()) * 100, 2)
    raw_class = disease_classes[idx] if idx < len(disease_classes) else f"Class_{idx}"

    crop, disease = parse_class_name(raw_class)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    return {
        "crop": crop,
        "disease": disease,
        "confidence": confidence_pct,
        "class_name": raw_class,
        "raw_class": raw_class,
        "is_leaf": True,
        "image_valid": True,
        "inference_time_ms": round(elapsed_ms, 2)
    }

@app.post("/predict/crop-health")
async def predict_crop_health(
    image: UploadFile = File(...),
    Fertilizer: float = Form(...),
    temp: float = Form(...),
    N: float = Form(...),
    P: float = Form(...),
    K: float = Form(...),
    crop: Optional[str] = Form(None)
):
    if leaf_gate_model is None or disease_model is None or yield_model is None or severity_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML models are not fully loaded."
        )

    filename = image.filename or ""
    contents = await image.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img.verify()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image."
        )

    img_meta = {
        "filename": filename,
        "size_bytes": len(contents)
    }

    # Execute pipeline and capture final output
    final_output = None
    for event in run_crop_health_pipeline(
        pil_img=pil_img,
        img_meta=img_meta,
        fertilizer=Fertilizer,
        temp=temp,
        n=N,
        p=P,
        k=K,
        selected_crop=crop
    ):
        st = event.get("stage")
        stat = event.get("status")
        if st in ["analysis_complete", "crop_mismatch"]:
            final_output = event.get("details")
        elif st in ["image_validation", "leaf_validation"] and stat == "rejected":
            final_output = event.get("details")
            break

    return final_output

@app.post("/predict/crop-health/stream")
async def predict_crop_health_stream(
    image: UploadFile = File(...),
    Fertilizer: float = Form(...),
    temp: float = Form(...),
    N: float = Form(...),
    P: float = Form(...),
    K: float = Form(...),
    crop: Optional[str] = Form(None)
):
    if leaf_gate_model is None or disease_model is None or yield_model is None or severity_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML models are not fully loaded."
        )

    filename = image.filename or ""
    contents = await image.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img.verify()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image."
        )

    img_meta = {
        "filename": filename,
        "size_bytes": len(contents)
    }

    async def event_generator():
        for event in run_crop_health_pipeline(
            pil_img=pil_img,
            img_meta=img_meta,
            fertilizer=Fertilizer,
            temp=temp,
            n=N,
            p=P,
            k=K,
            selected_crop=crop
        ):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.01) # Yield control for streaming

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
