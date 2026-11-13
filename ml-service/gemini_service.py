"""
CropLens AI - Backend Gemini Explanation Engine

Generates grounded, disease-specific agricultural explanations for CropLens ML results
using Gemini models via Google AI Studio API, strictly grounded in knowledge_base.py.

Security & Architecture Principles:
- GEMINI_API_KEY is read strictly from backend server environment.
- No API keys are ever sent to client, saved to logs, or exposed in frontend bundles.
- If Gemini is unreachable or unconfigured, dynamically returns a rich, disease-specific
  explanation compiled directly from knowledge_base.py (not generic boilerplate).
- Validates all AI JSON output structures before returning.
- Clearly flags fallbacks, healthy specimens, and low-confidence predictions (< 70%).
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import sys
import httpx

# -----------------------------------------------------------------------------
# Environment Configuration (.env loading)
# -----------------------------------------------------------------------------
_base_dir = os.path.dirname(os.path.abspath(__file__))
_ml_service_env = os.path.join(_base_dir, ".env")
_workspace_env = os.path.join(_base_dir, "..", ".env")

# Ensure workspace packages (e.g. kaggle-env) are accessible if running under system python
_kaggle_site_packages = os.path.join(_base_dir, "..", "kaggle-env", "Lib", "site-packages")
if os.path.isdir(_kaggle_site_packages) and _kaggle_site_packages not in sys.path:
    sys.path.append(_kaggle_site_packages)

try:
    from dotenv import load_dotenv
    # 1. Load ml-service/.env using a reliable path relative to gemini_service.py
    if os.path.isfile(_ml_service_env):
        load_dotenv(dotenv_path=_ml_service_env, override=False)
    # 2. Secondary fallback: workspace root .env if present
    if os.path.isfile(_workspace_env):
        load_dotenv(dotenv_path=_workspace_env, override=False)
except ImportError:
    # Pure-python fallback parser if python-dotenv is not installed
    def _load_env_fallback(path: str):
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass
    _load_env_fallback(_ml_service_env)
    _load_env_fallback(_workspace_env)

from knowledge_base import (
    DISEASE_KNOWLEDGE_BASE,
    get_disease_info,
    is_healthy_class,
)

logger = logging.getLogger("croplens.gemini")

# Model configuration
DEFAULT_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
# Dedicated candidate list: only the primary model during initial verification (no automatic fallback to 3.8/2.0)
CANDIDATE_MODELS = [DEFAULT_GEMINI_MODEL]

GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
REQUEST_TIMEOUT_SECONDS = 45.0
HTTP_TIMEOUT = httpx.Timeout(45.0, connect=15.0, read=45.0, write=15.0)


def normalize_confidence(val: Any) -> Optional[float]:
    """
    Normalize confidence to percentage scale (0.0 to 100.0).
    Handles both unit interval (0.0 - 1.0) and percentage scale (0.0 - 100.0).
    Examples:
        0.94 -> 94.0
        94.0 -> 94.0
        1.0 -> 100.0
        0.0 -> 0.0
        0.55 -> 55.0
        55.0 -> 55.0
        None -> None
    """
    if val is None:
        return None
    try:
        f = float(val)
    except (ValueError, TypeError):
        return None
    # If strictly between 0 and 1.0 inclusive, convert unit probability to percentage
    if 0.0 < f <= 1.0:
        return round(f * 100.0, 2)
    return round(f, 2)


def format_confidence_pct(val: Any) -> str:
    """Format confidence as clean percentage string (e.g. '94%' or '94.5%')."""
    c = normalize_confidence(val)
    if c is None:
        return "N/A"
    if c.is_integer():
        return f"{int(c)}%"
    return f"{c:.1f}%"


def resolve_knowledge_base_entry(
    raw_class: Optional[str] = None,
    crop: Optional[str] = None,
    disease: Optional[str] = None
) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """
    Resolve a class identifier to its corresponding knowledge_base.py entry.
    Returns (resolved_raw_class, entry_dict).
    """
    if raw_class and raw_class in DISEASE_KNOWLEDGE_BASE:
        return raw_class, DISEASE_KNOWLEDGE_BASE[raw_class]

    # Normalize inputs
    crop_clean = (crop or "").strip()
    disease_clean = (disease or "").strip()

    if not crop_clean and not disease_clean:
        return None, None

    # Check for healthy
    if disease_clean.lower() == "healthy" or "healthy" in disease_clean.lower():
        target = f"{crop_clean}___healthy"
        for k in DISEASE_KNOWLEDGE_BASE:
            if k.lower() == target.lower():
                return k, DISEASE_KNOWLEDGE_BASE[k]
        # Match crop
        for k, v in DISEASE_KNOWLEDGE_BASE.items():
            if v["crop"].lower() == crop_clean.lower() and v["is_healthy"]:
                return k, v

    # Match by crop and disease name
    for k, v in DISEASE_KNOWLEDGE_BASE.items():
        if (
            v["crop"].lower() == crop_clean.lower()
            and v["disease_name"].lower() == disease_clean.lower()
        ):
            return k, v

    # Fuzzy match by substring
    for k, v in DISEASE_KNOWLEDGE_BASE.items():
        if (
            v["crop"].lower() == crop_clean.lower()
            and (v["disease_name"].lower() in disease_clean.lower() or disease_clean.lower() in v["disease_name"].lower())
        ):
            return k, v

    return None, None


def generate_grounded_fallback(
    ml_result: Dict[str, Any],
    kb_entry: Optional[Dict[str, Any]],
    reason_message: str = "Gemini API unavailable"
) -> Dict[str, Any]:
    """
    Generate a rich, disease-specific explanation compiled directly from knowledge_base.py
    when Gemini is unreachable, rate-limited, or unconfigured.
    """
    crop = ml_result.get("crop") or ml_result.get("predicted_crop") or "Crop Specimen"
    disease = ml_result.get("disease") or "Diagnosed Condition"
    raw_conf = ml_result.get("confidence") if ml_result.get("confidence") is not None else ml_result.get("disease_confidence")
    confidence = normalize_confidence(raw_conf) if raw_conf is not None else 0.0
    conf_str = format_confidence_pct(confidence)

    severity_val = ml_result.get("severity") or "Unavailable"
    severity_status = ml_result.get("severity_status") or "unavailable"
    sev_conf = normalize_confidence(ml_result.get("severity_confidence"))

    overall_risk = ml_result.get("overall_risk") or "Low"
    predicted_yield = ml_result.get("predicted_yield")
    yield_risk = ml_result.get("yield_risk") or "Low"

    is_healthy = disease.lower() == "healthy" or severity_status == "healthy" or (kb_entry and kb_entry.get("is_healthy"))
    is_low_confidence = confidence < 70.0

    # Build warning
    warning = None
    if is_low_confidence:
        warning = (
            f"Diagnostic Caution: Model prediction confidence is {conf_str} (below 70%). "
            f"This classification is uncertain and should be visually confirmed by an agronomist before taking chemical action."
        )
    elif ml_result.get("warnings") and len(ml_result["warnings"]) > 0:
        warning = " ".join(ml_result["warnings"])

    # If no knowledge base entry found (e.g. unknown class)
    if not kb_entry:
        summary = (
            f"Diagnostic Summary for {crop}: Identified {disease} with {conf_str} confidence "
            f"and an overall {overall_risk} risk assessment."
        )
        what_it_means = (
            f"The image analysis model detected {disease} in {crop} with {conf_str} confidence. "
            f"Detailed botanical pathogen information is currently unavailable for this specific class."
        )
        what_to_monitor = [
            f"Inspect {crop} foliage daily for spreading necrotic spots or wilting.",
            "Monitor field humidity and soil drainage.",
            "Check soil moisture parameters against recommended crop thresholds.",
        ]
        next_steps = [
            "Sanitize pruning tools between rows to prevent potential pathogen dispersal.",
            "Consult a certified local agronomist for species-specific guidance.",
            "Maintain balanced crop fertility according to agricultural extension guidelines.",
        ]
        return {
            "is_fallback": True,
            "isFallback": True,
            "fallback_reason": reason_message,
            "fallbackReason": reason_message,
            "used_model": "Grounded Agricultural Knowledge Base (Offline Fallback)",
            "usedModel": "Grounded Agricultural Knowledge Base (Offline Fallback)",
            "summary": summary,
            "what_it_means": what_it_means,
            "what_to_monitor": what_to_monitor,
            "next_steps": next_steps,
            "warning": warning,
            "explanation_sections": {
                "disease_overview": what_it_means,
                "severity_interpretation": f"Severity status: {severity_status} ({severity_val}).",
            },
            "sources": [],
        }

    # Rich grounded fallback using authoritative knowledge base
    pathogen_info = kb_entry.get("causative_pathogen", {})
    sci_name = pathogen_info.get("scientific_name", "None")
    category = kb_entry.get("category", "General")
    overview = kb_entry.get("overview", "")
    symptoms = kb_entry.get("characteristic_symptoms", {})
    conditions = kb_entry.get("favorable_conditions", {})
    prevention = kb_entry.get("prevention_practices", [])
    management = kb_entry.get("recommended_management", {})
    sev_interp = kb_entry.get("severity_interpretation", {})
    triggers = kb_entry.get("professional_advice_triggers", [])
    sources = kb_entry.get("sources", [])

    if is_healthy:
        summary = (
            f"Crop Health Confirmation: {crop} foliage is diagnosed as Healthy "
            f"({conf_str} model confidence) with an overall {overall_risk} risk profile."
        )
        what_it_means = (
            f"The diagnostic analysis confirmed healthy {crop} leaf tissue with no active lesions, "
            f"fungal mycelium, or viral distortions detected. {overview} "
            f"Disease severity grading is not applicable (0% disease progression). "
        )
        if predicted_yield is not None:
            what_it_means += f"The soil/climate model estimates yield at {predicted_yield} t/ha ({yield_risk} yield risk)."

        what_to_monitor = [
            f"Maintain regular scouting to catch early signs of regional pests or foliar pathogens.",
            f"Optimal growth conditions: {conditions.get('temperature_range', 'Moderate')}, {conditions.get('humidity_moisture', 'Balanced moisture')}.",
            f"Soil targets: {conditions.get('soil_conditions', 'Well-drained balanced soil')}.",
        ]
        next_steps = prevention[:3] if len(prevention) >= 3 else [
            "Continue standard preventative agronomic practices and balanced fertilization.",
            "Maintain drip irrigation schedule to avoid waterlogging or drought stress.",
            "Routinely inspect leaf undersides during weekly field walkthroughs.",
        ]
    else:
        # Diseased specimen
        summary = (
            f"Diagnostic Summary for {crop}: Identified {kb_entry['disease_name']} ({conf_str} confidence, "
            f"Overall Risk: {overall_risk}). Pathogen: {sci_name} ({category})."
        )

        sev_note = ""
        sev_conf_str = f" ({format_confidence_pct(sev_conf)} model confidence)" if sev_conf is not None else ""
        if severity_val in ["Mild", "Severe"]:
            interp_text = sev_interp.get(severity_val.lower(), "")
            sev_note = f"Assessed severity is {severity_val}{sev_conf_str}: {interp_text}" if interp_text else f"Assessed severity is {severity_val}{sev_conf_str}."
        elif severity_status == "not_explicitly_graded":
            sev_note = "Severity is classified as single-stage (presence confirmed without sub-stage grading in dataset)."
        elif severity_status and severity_status != "unavailable":
            sev_note = f"Severity status: {severity_status}{sev_conf_str}."
        else:
            sev_note = "Severity grading: not evaluated or single-stage."

        what_it_means = (
            f"{crop} foliage shows active infection of {kb_entry['disease_name']}, caused by the {category.lower()} "
            f"agent {sci_name}. {overview} {sev_note} "
            f"Favored by {conditions.get('temperature_range', 'favorable temperatures')} and {conditions.get('humidity_moisture', 'elevated moisture')}."
        )
        if predicted_yield is not None:
            what_it_means += f" Soil/weather yield estimate: {predicted_yield} t/ha ({yield_risk} yield risk)."

        # Pull foliar symptoms directly from KB
        foliar_list = symptoms.get("foliar_symptoms", [])
        what_to_monitor = foliar_list[:3] if len(foliar_list) >= 3 else [
            f"Monitor {crop} leaves for expanding necrotic spots or lesions.",
            f"Watch for temperature and moisture triggers: {conditions.get('temperature_range', 'moderate temperatures')}.",
            f"Check for secondary spread across nearby canopy foliage.",
        ]

        # Pull cultural controls directly from KB
        cultural_list = management.get("cultural_controls", [])
        prevent_list = prevention[:2] if len(prevention) >= 2 else []
        next_steps = (cultural_list + prevent_list)[:3]
        if not next_steps:
            next_steps = [
                "Prune and safely dispose of infected lower leaves during dry midday weather.",
                "Avoid overhead irrigation to minimize canopy leaf wetness.",
                "Sanitize cutting tools between plants with alcohol or disinfectant.",
            ]

    # Package structured response
    return {
        "is_fallback": True,
        "isFallback": True,
        "fallback_reason": reason_message,
        "fallbackReason": reason_message,
        "used_model": "Grounded Agricultural Knowledge Base (Offline Fallback)",
        "usedModel": "Grounded Agricultural Knowledge Base (Offline Fallback)",
        "summary": summary,
        "what_it_means": what_it_means,
        "what_to_monitor": what_to_monitor,
        "next_steps": next_steps,
        "warning": warning,
        "explanation_sections": {
            "disease_overview": overview,
            "causative_pathogen": pathogen_info,
            "favorable_conditions": conditions,
            "characteristic_symptoms": symptoms,
            "transmission_and_spread": kb_entry.get("transmission_and_spread", {}),
            "prevention_practices": prevention,
            "recommended_management": management,
            "severity_interpretation": sev_interp.get(severity_val.lower(), "") if severity_val else "",
            "professional_advice_triggers": triggers,
        },
        "sources": sources,
    }


def build_gemini_prompt(
    ml_result: Dict[str, Any],
    kb_entry: Dict[str, Any],
    farm_context: Optional[Dict[str, Any]] = None,
    weather_context: Optional[Dict[str, Any]] = None
) -> Tuple[str, str]:
    """
    Construct system instructions and token-optimized grounded user prompt for Gemini.
    """
    crop = ml_result.get("crop") or ml_result.get("predicted_crop") or kb_entry["crop"]
    disease = ml_result.get("disease") or kb_entry["disease_name"]
    raw_conf = ml_result.get("confidence") if ml_result.get("confidence") is not None else ml_result.get("disease_confidence")
    confidence = normalize_confidence(raw_conf) if raw_conf is not None else 0.0
    conf_display = format_confidence_pct(confidence)

    severity_val = ml_result.get("severity") or "Unavailable"
    severity_status = ml_result.get("severity_status") or "unavailable"
    sev_conf = normalize_confidence(ml_result.get("severity_confidence"))
    sev_conf_str = f" ({format_confidence_pct(sev_conf)} model confidence)" if sev_conf is not None else ""

    overall_risk = ml_result.get("overall_risk") or "Low"
    predicted_yield = ml_result.get("predicted_yield")
    yield_risk = ml_result.get("yield_risk") or "Low"

    is_healthy = kb_entry.get("is_healthy", False)

    # Format farm context
    farm_info_lines = []
    if farm_context:
        fert = farm_context.get("fertilizer") or farm_context.get("Fertilizer")
        temp = farm_context.get("temp") or farm_context.get("temperature")
        n = farm_context.get("n") or farm_context.get("N")
        p = farm_context.get("p") or farm_context.get("P")
        k = farm_context.get("k") or farm_context.get("K")
        if fert is not None: farm_info_lines.append(f"- Fertilizer: {fert} kg/ha")
        if temp is not None: farm_info_lines.append(f"- Field Temperature: {temp}°C")
        if n is not None: farm_info_lines.append(f"- Soil Nitrogen (N): {n} kg/ha")
        if p is not None: farm_info_lines.append(f"- Soil Phosphorus (P): {p} kg/ha")
        if k is not None: farm_info_lines.append(f"- Soil Potassium (K): {k} kg/ha")
        if farm_context.get("soil_type") or farm_context.get("soilType"):
            farm_info_lines.append(f"- Soil Type: {farm_context.get('soil_type') or farm_context.get('soilType')}")
    farm_text = "\n".join(farm_info_lines) if farm_info_lines else "Farm soil/fertilizer values not supplied by user."

    # Format weather context
    weather_lines = []
    if weather_context:
        w_temp = weather_context.get("temperature")
        w_hum = weather_context.get("humidity")
        w_rain = weather_context.get("precipitation")
        w_wind = weather_context.get("wind_speed") or weather_context.get("windSpeed")
        w_loc = weather_context.get("location_name") or weather_context.get("locationName")
        if w_loc: weather_lines.append(f"- Location: {w_loc}")
        if w_temp is not None: weather_lines.append(f"- Ambient Temperature: {w_temp}°C")
        if w_hum is not None: weather_lines.append(f"- Relative Humidity: {w_hum}%")
        if w_rain is not None: weather_lines.append(f"- Precipitation: {w_rain} mm")
        if w_wind is not None: weather_lines.append(f"- Wind Speed: {w_wind} km/h")
    weather_text = "\n".join(weather_lines) if weather_lines else "Regional live weather context unavailable."

    # Extract concise, non-redundant agronomic grounding points
    pathogen_info = kb_entry.get("causative_pathogen", {})
    cond_info = kb_entry.get("favorable_conditions", {})
    symp_info = kb_entry.get("characteristic_symptoms", {})
    trans_info = kb_entry.get("transmission_and_spread", {})
    mgmt_info = kb_entry.get("recommended_management", {})
    prev_list = kb_entry.get("prevention_practices", [])
    triggers = kb_entry.get("professional_advice_triggers", [])
    sev_interp = kb_entry.get("severity_interpretation", {})

    dossier_lines = [
        f"Pathogen: {pathogen_info.get('scientific_name', 'None')} ({kb_entry.get('category', 'General')})",
        f"Common Name: {pathogen_info.get('common_name', 'N/A')}",
        f"Taxonomy: {pathogen_info.get('taxonomic_order_family', 'N/A')}",
        f"Overview: {kb_entry.get('overview', '')}",
        f"Favorable Conditions: Temp: {cond_info.get('temperature_range', 'N/A')}; Moisture: {cond_info.get('humidity_moisture', 'N/A')}; Triggers: {'; '.join(cond_info.get('key_triggers', []))}",
        f"Foliar Symptoms: {'; '.join(symp_info.get('foliar_symptoms', []))}",
        f"Stem/Fruit Symptoms: {'; '.join(symp_info.get('stem_and_fruit_symptoms', []))}" if symp_info.get("stem_and_fruit_symptoms") else "",
        f"Progression: {symp_info.get('progression', '')}",
        f"Transmission & Overwintering: Vectors: {'; '.join(trans_info.get('primary_vectors', []))}; Survival: {trans_info.get('survival_mechanism', '')}",
        f"Prevention: {'; '.join(prev_list)}",
        f"Cultural Controls: {'; '.join(mgmt_info.get('cultural_controls', []))}",
        f"Protectants/Biologicals: {'; '.join(mgmt_info.get('biological_and_protectant_measures', []))}",
        f"Dosage Precaution: {mgmt_info.get('cautionary_dosage_note', '')}",
        f"Severity Notes: {sev_interp.get(severity_val.lower(), '') if severity_val in ['Mild', 'Severe'] else ''}",
        f"Expert Advice Triggers: {'; '.join(triggers)}"
    ]
    dossier_text = "\n".join([line for line in dossier_lines if line and not line.endswith(": N/A")])

    system_instructions = (
        "You are CropLens AI, an authoritative agricultural plant pathology explanation engine.\n"
        "Your task is to explain the machine learning diagnosis to a farmer in clear, actionable, professional language.\n\n"
        "CRITICAL GROUNDING RULES:\n"
        "1. GROUND ALL PATHOLOGY FACTS EXCLUSIVELY IN THE SUPPLIED KNOWLEDGE BASE DOSSIER.\n"
        "2. State the exact causative pathogen scientific name and taxonomic category as supplied.\n"
        "3. NEVER invent chemical dosages, pesticide mixing ratios, application rates, or brand names. All chemical advice must strictly note that dosages must follow product labels and local extension recommendations.\n"
        "4. Clearly distinguish confirmed ML findings (e.g., detected disease and confidence percentage) from possible environmental causes or risk factors.\n"
        "5. DO NOT invent missing farm or weather details. If a parameter was not supplied, explicitly note it as unavailable.\n"
        "6. If the specimen is diagnosed as Healthy, confirm healthy crop foliage, explain proper maintenance, and state that disease severity grading is not applicable (0% progression).\n"
        "7. If disease confidence is below 70%, prominently include a diagnostic advisory warning that the result is uncertain and must be confirmed by an agronomist before taking chemical action.\n"
        "8. Return STRICTLY valid JSON conforming to the requested schema with no surrounding conversational text or markdown codeblocks outside the JSON.\n"
    )

    user_prompt = f"""
=== MACHINE LEARNING DIAGNOSTIC OUTPUT ===
- Crop: {crop}
- Identified Condition: {disease}
- Diagnosis Confidence: {conf_display}
- Disease Severity Grade: {severity_val}{sev_conf_str} (Status: {severity_status})
- Expected Yield (Feature Model): {predicted_yield if predicted_yield is not None else 'N/A'} t/ha ({yield_risk} Yield Risk)
- Synthesized Overall Risk: {overall_risk}

=== FARM & ENVIRONMENTAL CONTEXT ===
{farm_text}
{weather_text}

=== VERIFIED AGRICULTURAL KNOWLEDGE BASE DOSSIER ===
{dossier_text}

=== REQUIRED JSON OUTPUT SCHEMA ===
{{
  "summary": "Clear, concise diagnostic summary highlighting crop, disease, causative pathogen, confidence, and yield risk.",
  "what_it_means": "Detailed explanation synthesizing the disease overview, causative pathogen, observed severity stage, and how current environmental conditions relate to disease pressure.",
  "what_to_monitor": [
    "Specific foliar symptom or lesion indicator to check 1",
    "Specific environmental or moisture factor to monitor 2",
    "Spread vector or canopy zone to inspect 3"
  ],
  "next_steps": [
    "Concrete cultural management or sanitation action 1",
    "Preventative or biological protectant measure without uncalibrated dosages 2",
    "Long-term crop rotation or field hygiene practice 3"
  ],
  "warning": "Warning note if confidence < 70% or high risk advisory, otherwise null",
  "explanation_sections": {{
    "disease_overview": "Overview of the disease and pathogen biology.",
    "favorable_conditions": "Environmental conditions (temperature, humidity) promoting spread.",
    "characteristic_symptoms": "Key foliar, stem, and fruit symptoms to identify in the field.",
    "transmission_and_spread": "Dispersal vectors and overwintering mechanisms.",
    "prevention_practices": ["Preventative practice 1", "Practice 2"],
    "recommended_management": {{
      "cultural_controls": ["Cultural control 1", "Control 2"],
      "protectant_measures": ["Protectant measure 1"],
      "dosage_caution": "Specific chemical dosages must follow manufacturer labels and regional agricultural extension guidance."
    }},
    "severity_interpretation": "Interpretation of the observed severity grade.",
    "expert_consultation_triggers": ["Condition requiring professional agronomist inspection 1", "Trigger 2"]
  }}
}}
Return JSON strictly.
"""
    return system_instructions, user_prompt


def validate_and_normalize_ai_response(
    raw_json: Any,
    kb_entry: Dict[str, Any]
) -> Tuple[bool, Dict[str, Any]]:
    """
    Validate that Gemini's output matches the required schema and normalize array fields.
    """
    if not isinstance(raw_json, dict):
        return False, {}

    summary = raw_json.get("summary")
    what_it_means = raw_json.get("what_it_means")
    what_to_monitor = raw_json.get("what_to_monitor")
    next_steps = raw_json.get("next_steps")

    if not isinstance(summary, str) or len(summary.strip()) == 0:
        return False, {}
    if not isinstance(what_it_means, str) or len(what_it_means.strip()) == 0:
        return False, {}

    # Normalize what_to_monitor to list of strings
    if isinstance(what_to_monitor, list):
        normalized_monitor = [str(x) for x in what_to_monitor if x]
    elif isinstance(what_to_monitor, str) and what_to_monitor.strip():
        normalized_monitor = [what_to_monitor.strip()]
    else:
        normalized_monitor = kb_entry.get("characteristic_symptoms", {}).get("foliar_symptoms", [])[:3]

    # Normalize next_steps to list of strings
    if isinstance(next_steps, list):
        normalized_steps = [str(x) for x in next_steps if x]
    elif isinstance(next_steps, str) and next_steps.strip():
        normalized_steps = [next_steps.strip()]
    else:
        normalized_steps = kb_entry.get("prevention_practices", [])[:3]

    warning = raw_json.get("warning")
    if warning is not None and not isinstance(warning, str):
        warning = str(warning)

    sections = raw_json.get("explanation_sections")
    if not isinstance(sections, dict):
        sections = {
            "disease_overview": kb_entry.get("overview", ""),
            "causative_pathogen": kb_entry.get("causative_pathogen", {}),
            "favorable_conditions": kb_entry.get("favorable_conditions", {}),
            "characteristic_symptoms": kb_entry.get("characteristic_symptoms", {}),
            "transmission_and_spread": kb_entry.get("transmission_and_spread", {}),
            "prevention_practices": kb_entry.get("prevention_practices", []),
            "recommended_management": kb_entry.get("recommended_management", {}),
            "severity_interpretation": kb_entry.get("severity_interpretation", {}),
            "professional_advice_triggers": kb_entry.get("professional_advice_triggers", []),
        }

    normalized = {
        "summary": summary.strip(),
        "what_it_means": what_it_means.strip(),
        "what_to_monitor": normalized_monitor,
        "next_steps": normalized_steps,
        "warning": warning,
        "explanation_sections": sections,
        "sources": kb_entry.get("sources", []),
    }
    return True, normalized


def generate_crop_health_explanation(
    ml_result: Dict[str, Any],
    farm_context: Optional[Dict[str, Any]] = None,
    weather_context: Optional[Dict[str, Any]] = None,
    custom_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point for generating AI explanations.
    Queries Gemini using server-side GEMINI_API_KEY (or optional request-level custom key).
    Falls back gracefully to rich knowledge-base explanation if Gemini is unavailable.
    """
    raw_class = ml_result.get("raw_class")
    crop = ml_result.get("crop") or ml_result.get("predicted_crop")
    disease = ml_result.get("disease")
    raw_conf = ml_result.get("confidence") if ml_result.get("confidence") is not None else ml_result.get("disease_confidence")
    confidence = normalize_confidence(raw_conf) if raw_conf is not None else 0.0
    ml_result["confidence"] = confidence
    ml_result["disease_confidence"] = confidence
    if "severity_confidence" in ml_result and ml_result["severity_confidence"] is not None:
        ml_result["severity_confidence"] = normalize_confidence(ml_result["severity_confidence"])

    # 1. Resolve knowledge base entry
    resolved_class, kb_entry = resolve_knowledge_base_entry(raw_class, crop, disease)
    if kb_entry and not raw_class:
        ml_result["raw_class"] = resolved_class

    # 2. Check API Key
    # Priority: 1. Request custom override key (BYOK), 2. Server GEMINI_API_KEY env var
    api_key = None
    if isinstance(custom_api_key, str) and custom_api_key.strip():
        api_key = custom_api_key.strip()
    else:
        env_key = os.environ.get("GEMINI_API_KEY", "")
        if isinstance(env_key, str) and env_key.strip():
            api_key = env_key.strip()

    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        logger.info("GEMINI_API_KEY is not configured on server. Returning grounded knowledge-base fallback.")
        return generate_grounded_fallback(
            ml_result=ml_result,
            kb_entry=kb_entry,
            reason_message="Gemini API key is not configured on the backend server."
        )

    # If no knowledge base entry was found for this class, use fallback
    if not kb_entry:
        logger.warning(f"No knowledge base entry found for crop='{crop}', disease='{disease}'. Using generic fallback.")
        return generate_grounded_fallback(
            ml_result=ml_result,
            kb_entry=None,
            reason_message=f"Class '{crop} - {disease}' not found in knowledge base."
        )

    # 3. Build Prompt
    system_instructions, user_prompt = build_gemini_prompt(
        ml_result=ml_result,
        kb_entry=kb_entry,
        farm_context=farm_context,
        weather_context=weather_context
    )

    last_error_message = "Gemini API call failed"

    # 4. Try the primary Gemini model (avoiding duplicate model attempts)
    with httpx.Client(timeout=HTTP_TIMEOUT) as client:
        active_model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
        models_to_try = [active_model]

        for model_name in models_to_try:
            endpoint = f"{GEMINI_API_BASE_URL}/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_instructions}\n\n{user_prompt}"}],
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2,
                    "maxOutputTokens": 1500,
                },
            }

            try:
                response = client.post(
                    endpoint,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code != 200:
                    safe_err = response.text[:200]
                    if api_key and api_key in safe_err:
                        safe_err = safe_err.replace(api_key, "[REDACTED]")
                    last_error_message = f"Gemini HTTP {response.status_code} ({model_name}): {safe_err}"
                    logger.warning(f"Model {model_name} HTTP error {response.status_code}: {safe_err}")
                    continue

                res_data = response.json()
                raw_text = (
                    res_data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )

                if not raw_text:
                    last_error_message = f"Empty candidate response from {model_name}"
                    logger.warning(f"Model {model_name} returned empty candidate parts")
                    continue

                # Strip potential markdown formatting
                clean_json_str = raw_text.replace("```json", "").replace("```", "").strip()
                parsed_json = json.loads(clean_json_str)

                valid, normalized = validate_and_normalize_ai_response(parsed_json, kb_entry)
                if not valid:
                    last_error_message = f"Schema validation failed for output from {model_name}"
                    logger.warning(f"Model {model_name} output failed schema validation")
                    continue

                # Enforce low confidence advisory if confidence < 70%
                if confidence < 70.0:
                    conf_display = format_confidence_pct(confidence)
                    if not normalized.get("warning") or "70%" not in str(normalized["warning"]):
                        normalized["warning"] = (
                            f"Diagnostic Caution: Model prediction confidence is {conf_display} (below 70%). "
                            f"This classification is uncertain and must be visually verified by an agronomist before taking chemical action."
                        )

                # Return successful AI explanation
                return {
                    "is_fallback": False,
                    "isFallback": False,
                    "fallback_reason": None,
                    "fallbackReason": None,
                    "used_model": model_name,
                    "usedModel": model_name,
                    "used_custom_key": bool(custom_api_key),
                    "usedCustomKey": bool(custom_api_key),
                    "summary": normalized["summary"],
                    "what_it_means": normalized["what_it_means"],
                    "what_to_monitor": normalized["what_to_monitor"],
                    "next_steps": normalized["next_steps"],
                    "warning": normalized["warning"],
                    "explanation_sections": normalized["explanation_sections"],
                    "sources": normalized["sources"],
                }

            except httpx.ConnectTimeout as ct:
                last_error_message = f"Connection timeout to {model_name} after 15s: {str(ct)}"
                logger.warning(f"Model {model_name} failed: Connection timeout")
            except httpx.ReadTimeout as rt:
                last_error_message = f"Read timeout from {model_name} after 45s: {str(rt)}"
                logger.warning(f"Model {model_name} failed: Read timeout (exceeded 45s)")
            except httpx.ConnectError as ce:
                last_error_message = f"Connection error to {model_name}: {type(ce).__name__}"
                logger.warning(f"Model {model_name} failed: Connection error ({type(ce).__name__})")
            except json.JSONDecodeError as jde:
                last_error_message = f"Invalid JSON response from {model_name}: {str(jde)}"
                logger.warning(f"Model {model_name} failed: Invalid JSON response ({str(jde)})")
            except httpx.RequestError as req_err:
                last_error_message = f"Network request error to {model_name}: {type(req_err).__name__}"
                logger.warning(f"Model {model_name} failed: Network error ({type(req_err).__name__})")
            except Exception as e:
                last_error_message = f"Unexpected failure querying {model_name}: {type(e).__name__} - {str(e)}"
                logger.warning(f"Model {model_name} failed: Unexpected error ({type(e).__name__})")

    # 5. Primary model failed or timed out -> Graceful fallback to grounded knowledge base
    logger.warning(f"Primary Gemini model ({active_model}) failed. Activating grounded knowledge-base fallback. Reason: {last_error_message}")
    return generate_grounded_fallback(
        ml_result=ml_result,
        kb_entry=kb_entry,
        reason_message=f"Gemini service unavailable ({last_error_message})"
    )
