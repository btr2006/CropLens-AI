"""
CropGuard AI - Crop Health Risk Fusion Module

Provides rule-based fusion logic combining:
1. Stage 1 Plant Disease Classifier outputs (38 classes)
2. Stage 2 Disease-Conditioned Severity Model outputs (AI Challenger 2018 / Single-stage / Healthy / Unavailable)
3. Soil & Weather Yield Prediction outputs

NOTE ON YIELD THRESHOLDS:
Yield risk thresholds are project-level demo parameters and must be calibrated
with real agronomic crop data prior to real-world deployment.
"""

from typing import Dict, Any, Tuple, Optional

# Project-level demo thresholds for yield risk classification
YIELD_RISK_LOW_THRESHOLD: float = 15.0     # Yield >= 15.0 -> Low Risk
YIELD_RISK_MEDIUM_THRESHOLD: float = 8.0    # 8.0 <= Yield < 15.0 -> Medium Risk
                                           # Yield < 8.0 -> High Risk

DISEASE_CONFIDENCE_WARNING_THRESHOLD: float = 70.0  # Disease confidence below 70% triggers warning
SEVERITY_CONFIDENCE_WARNING_THRESHOLD: float = 70.0 # Severity confidence below 70% triggers warning


def calculate_yield_risk(predicted_yield: float) -> Tuple[str, str]:
    """
    Evaluate rule-based yield risk based on predicted yield value.
    Returns (yield_risk_level, explanation_string).
    """
    if predicted_yield >= YIELD_RISK_LOW_THRESHOLD:
        risk_level = "Low"
    elif predicted_yield >= YIELD_RISK_MEDIUM_THRESHOLD:
        risk_level = "Medium"
    else:
        risk_level = "High"

    explanation = (
        f"Yield estimate based on the trained soil/weather/fertilizer feature model: {predicted_yield:.2f} t/ha (Yield Risk: {risk_level}). "
        f"Provisional demo thresholds: High (< {YIELD_RISK_MEDIUM_THRESHOLD}), "
        f"Medium ({YIELD_RISK_MEDIUM_THRESHOLD}-{YIELD_RISK_LOW_THRESHOLD}), "
        f"Low (>= {YIELD_RISK_LOW_THRESHOLD})."
    )
    return risk_level, explanation


def fuse_crop_health_risk(
    disease_res: Dict[str, Any],
    severity_block: Dict[str, Any],
    yield_res: Dict[str, Any],
    timings_ms: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Synthesize disease, severity, and yield results into a unified crop-health report.
    """
    crop = disease_res.get("crop", "Unknown")
    disease = disease_res.get("disease", "Unknown")
    raw_class = disease_res.get("raw_class", "")
    disease_conf = float(disease_res.get("confidence", 0.0))

    predicted_yield = float(yield_res.get("predicted_yield", 0.0))
    yield_risk_level, yield_explanation = calculate_yield_risk(predicted_yield)

    warnings = []
    risk_explanation = []

    # 1. Disease Confidence Evaluation
    if disease_conf < DISEASE_CONFIDENCE_WARNING_THRESHOLD:
        warnings.append(
            f"Diagnosis confidence is below {DISEASE_CONFIDENCE_WARNING_THRESHOLD}%; consult an agronomist or plant-disease specialist before taking treatment action."
        )
        risk_explanation.append(
            f"Disease model prediction has lower model confidence ({disease_conf:.2f}%). Diagnosis should be visually verified."
        )
    else:
        risk_explanation.append(
            f"Disease model identified '{disease}' in '{crop}' with {disease_conf:.2f}% confidence."
        )

    # 2. Severity Evaluation & Explanations
    sev_status = severity_block.get("severity_status", "unavailable")
    sev_val = severity_block.get("severity")
    sev_conf = severity_block.get("severity_confidence")
    sev_supported = severity_block.get("severity_model_supported", False)
    sev_explanation = severity_block.get("severity_explanation", "")

    disease_is_healthy = (disease.strip().lower() == "healthy" or raw_class.lower().endswith("___healthy"))

    if disease_is_healthy:
        risk_explanation.append("Crop is assessed as Healthy ($0\%$ disease severity progression).")
    elif sev_status == "graded" and sev_supported:
        if sev_conf is not None and sev_conf < SEVERITY_CONFIDENCE_WARNING_THRESHOLD:
            warnings.append(
                f"Severity prediction has lower model confidence ({sev_conf:.2f}%). Treat severity grading cautiously."
            )
        risk_explanation.append(
            f"Multi-crop severity model assessed '{disease}' severity as '{sev_val}' with {sev_conf:.2f}% confidence."
        )
    elif sev_status == "not_explicitly_graded":
        risk_explanation.append(
            f"Disease '{disease}' is detected as active infection (General / Single-stage). The source data does not provide Mild/Severe grading for this disease."
        )
    else:
        risk_explanation.append(
            f"Severity assessment unavailable: {sev_explanation}"
        )

    # 3. Add Yield Explanation
    risk_explanation.append(yield_explanation)

    # 4. Synthesize Overall Risk
    # Rules:
    # - Healthy: Overall Risk = Yield Risk (Low or Medium; if Yield Risk is High, Overall is Medium)
    # - Graded Mild: Overall Risk is Medium (if Yield Risk is High -> High)
    # - Graded Severe: Overall Risk is High
    # - General / Single-stage: Active infection -> If Yield Risk High -> High; else Medium
    # - Unavailable: If Disease detected -> High if Yield Risk High, else Medium
    if disease_is_healthy:
        if yield_risk_level == "High":
            overall_risk = "Medium"
        else:
            overall_risk = "Low"
    elif sev_status == "graded" and sev_val == "Severe":
        overall_risk = "High"
    elif sev_status == "graded" and sev_val == "Mild":
        if yield_risk_level == "High":
            overall_risk = "High"
        else:
            overall_risk = "Medium"
    elif sev_status == "not_explicitly_graded":
        if yield_risk_level == "High":
            overall_risk = "High"
        else:
            overall_risk = "Medium"
    else:
        # Severity unavailable
        risk_explanation.append(
            "Overall risk is determined from disease status and soil/weather yield potential without guessing severity."
        )
        if yield_risk_level == "High":
            overall_risk = "High"
        else:
            overall_risk = "Medium"

    # Compatibility severity block for legacy frontend/report consumers
    legacy_severity_block = {
        "available": (sev_status in ["graded", "healthy"]),
        "severity": sev_val if sev_val else "Not available",
        "severity_level": sev_val.lower() if sev_val else "unavailable",
        "confidence": sev_conf,
        "reason": None if sev_supported or disease_is_healthy else sev_explanation
    }

    return {
        "crop_mismatch": False,
        "crop": crop,
        "predicted_crop": crop,
        "disease": disease,
        "disease_confidence": disease_conf,
        "severity": sev_val,
        "severity_confidence": sev_conf,
        "severity_model_supported": sev_supported,
        "severity_status": sev_status,
        "severity_explanation": sev_explanation,
        "severity_block": legacy_severity_block,
        "yield": {
            "predicted_yield": predicted_yield,
            "yield_risk": yield_risk_level
        },
        "predicted_yield": predicted_yield,
        "yield_risk": yield_risk_level,
        "overall_risk": overall_risk,
        "risk_explanation": risk_explanation,
        "warnings": warnings,
        "timings_ms": timings_ms or {}
    }
