"""
Automated tests for CropLens AI Gemini Explanation Engine & /explain/crop-health endpoint (Stage 2)
"""

import os
import json
import pytest
import sys
import asyncio
import httpx
from unittest.mock import patch, MagicMock, AsyncMock

# Add ml-service and workspace dependencies to path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.abspath(os.path.join(current_dir, ".."))
workspace_dir = os.path.abspath(os.path.join(ml_service_dir, ".."))
kaggle_site_packages = os.path.join(workspace_dir, "kaggle-env", "Lib", "site-packages")

if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)
if os.path.exists(kaggle_site_packages) and kaggle_site_packages not in sys.path:
    sys.path.append(kaggle_site_packages)

# Mock torch dependencies if not functional in current test environment
try:
    import torch
except (ImportError, OSError):
    mock_torch = MagicMock()
    sys.modules["torch"] = mock_torch
    sys.modules["torch.nn"] = MagicMock()
    sys.modules["torchvision"] = MagicMock()
    sys.modules["torchvision.models"] = MagicMock()
    sys.modules["torchvision.transforms"] = MagicMock()

from main import app, explain_crop_health_endpoint, ExplainCropHealthRequest
from gemini_service import (
    resolve_knowledge_base_entry,
    generate_grounded_fallback,
    build_gemini_prompt,
    validate_and_normalize_ai_response,
    generate_crop_health_explanation,
    normalize_confidence,
    format_confidence_pct,
    DEFAULT_GEMINI_MODEL,
    CANDIDATE_MODELS,
    REQUEST_TIMEOUT_SECONDS,
    HTTP_TIMEOUT,
)
from knowledge_base import get_disease_info


class TestKnowledgeBaseResolver:
    """Test resolution of diagnostic outputs to knowledge base entries."""

    def test_exact_raw_class_resolution(self):
        raw_class, entry = resolve_knowledge_base_entry(raw_class="Tomato___Early_blight")
        assert raw_class == "Tomato___Early_blight"
        assert entry is not None
        assert entry["disease_name"] == "Early Blight"
        assert entry["crop"] == "Tomato"

    def test_crop_disease_string_resolution(self):
        raw_class, entry = resolve_knowledge_base_entry(crop="Apple", disease="Apple Scab")
        assert raw_class == "Apple___Apple_scab"
        assert entry is not None
        assert entry["causative_pathogen"]["scientific_name"] == "Venturia inaequalis"

    def test_healthy_specimen_resolution(self):
        raw_class, entry = resolve_knowledge_base_entry(crop="Tomato", disease="Healthy")
        assert raw_class == "Tomato___healthy"
        assert entry is not None
        assert entry["is_healthy"] is True

    def test_unknown_class_resolution(self):
        raw_class, entry = resolve_knowledge_base_entry(crop="Dragonfruit", disease="Unknown Fungus")
        assert raw_class is None
        assert entry is None


class TestGroundedFallbackGeneration:
    """Test that offline/unavailable fallback produces rich, disease-specific output."""

    def test_diseased_fallback_early_blight(self):
        ml_result = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "confidence": 92.5,
            "severity": "Mild",
            "severity_status": "graded",
            "overall_risk": "Medium",
            "predicted_yield": 14.2,
            "yield_risk": "Medium",
        }
        kb_entry = get_disease_info("Tomato___Early_blight")
        res = generate_grounded_fallback(ml_result, kb_entry, "Gemini key unconfigured")

        assert res["is_fallback"] is True
        assert res["isFallback"] is True
        assert "Gemini key unconfigured" in res["fallback_reason"]
        assert "Alternaria solani" in res["summary"]
        assert "Alternaria solani" in res["what_it_means"]
        assert len(res["what_to_monitor"]) >= 3
        assert len(res["next_steps"]) >= 3
        assert res["warning"] is None
        assert "cautionary_dosage_note" in res["explanation_sections"]["recommended_management"]

    def test_diseased_fallback_late_blight_oomycete(self):
        ml_result = {
            "crop": "Tomato",
            "disease": "Late Blight",
            "confidence": 95.0,
            "severity": "Severe",
            "severity_status": "graded",
            "overall_risk": "High",
            "predicted_yield": 8.0,
            "yield_risk": "High",
        }
        kb_entry = get_disease_info("Tomato___Late_blight")
        res = generate_grounded_fallback(ml_result, kb_entry, "Network error")

        assert res["is_fallback"] is True
        assert "Phytophthora infestans" in res["summary"]
        assert "oomycete" in res["what_it_means"].lower()
        # Verify Late Blight is distinctly different from Early Blight
        eb_res = generate_grounded_fallback(
            {"crop": "Tomato", "disease": "Early Blight", "confidence": 95.0},
            get_disease_info("Tomato___Early_blight")
        )
        assert res["summary"] != eb_res["summary"]
        assert res["what_it_means"] != eb_res["what_it_means"]
        assert res["what_to_monitor"] != eb_res["what_to_monitor"]

    def test_healthy_fallback(self):
        ml_result = {
            "crop": "Tomato",
            "disease": "Healthy",
            "confidence": 96.0,
            "severity": "Healthy",
            "severity_status": "healthy",
            "overall_risk": "Low",
            "predicted_yield": 18.5,
            "yield_risk": "Low",
        }
        kb_entry = get_disease_info("Tomato___healthy")
        res = generate_grounded_fallback(ml_result, kb_entry, "Offline test")

        assert res["is_fallback"] is True
        assert "Healthy" in res["summary"]
        assert "0% disease progression" in res["what_it_means"]
        assert res["warning"] is None

    def test_low_confidence_triggers_advisory_warning(self):
        ml_result = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "confidence": 62.4,  # Below 70% threshold
            "severity": "Mild",
            "severity_status": "graded",
            "overall_risk": "Medium",
        }
        kb_entry = get_disease_info("Tomato___Early_blight")
        res = generate_grounded_fallback(ml_result, kb_entry, "Low conf test")

        assert res["warning"] is not None
        assert "70%" in res["warning"]
        assert "uncertain" in res["warning"].lower() or "caution" in res["warning"].lower()


class TestDiseaseDifferentiation:
    """Ensure different diseases produce meaningfully different explanations."""

    def test_four_different_diseases_are_substantively_distinct(self):
        test_classes = [
            ("Tomato___Early_blight", "Fungal"),
            ("Tomato___Bacterial_spot", "Bacterial"),
            ("Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Viral"),
            ("Apple___Apple_scab", "Fungal"),
        ]

        results = []
        for raw_cls, cat in test_classes:
            kb = get_disease_info(raw_cls)
            ml_data = {"crop": kb["crop"], "disease": kb["disease_name"], "confidence": 88.0}
            out = generate_grounded_fallback(ml_data, kb)
            results.append((raw_cls, out))

        # Check all summaries and monitor lists are unique
        summaries = [r[1]["summary"] for r in results]
        assert len(set(summaries)) == len(results), "Summaries must be unique for different diseases"

        # Check pathogens are distinct
        pathogens = [r[1]["explanation_sections"]["causative_pathogen"]["scientific_name"] for r in results]
        assert len(set(pathogens)) == len(results), "Scientific pathogen names must differ"


class TestGeminiEngineMocking:
    """Test Gemini API success and error paths with mocked HTTP."""

    def test_successful_gemini_response(self):
        mock_ai_output = {
            "summary": "Mock Gemini AI Summary for Tomato Early Blight",
            "what_it_means": "The crop exhibits early blight caused by Alternaria solani under warm humid conditions.",
            "what_to_monitor": [
                "Inspect lower leaves for concentric rings",
                "Watch for chlorotic halos",
                "Monitor leaf wetness after rains"
            ],
            "next_steps": [
                "Prune lower infected leaves during dry hours",
                "Apply mulch to prevent soil splashing",
                "Follow standard extension guidance"
            ],
            "warning": None,
            "explanation_sections": {
                "disease_overview": "Fungal foliar disease",
                "severity_interpretation": "Mild progression"
            }
        }

        mock_gemini_resp = MagicMock()
        mock_gemini_resp.status_code = 200
        mock_gemini_resp.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": json.dumps(mock_ai_output)}]}}
            ]
        }

        with patch.object(httpx.Client, "post", return_value=mock_gemini_resp):
            ml_result = {
                "raw_class": "Tomato___Early_blight",
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 92.0,
                "severity": "Mild",
                "predicted_yield": 15.0,
                "overall_risk": "Medium"
            }

            result = generate_crop_health_explanation(
                ml_result=ml_result,
                custom_api_key="TEST_MOCK_KEY"
            )

            assert result["is_fallback"] is False
            assert result["isFallback"] is False
            assert result["summary"] == "Mock Gemini AI Summary for Tomato Early Blight"
            assert "Alternaria solani" in result["what_it_means"]
            assert result["used_custom_key"] is True

    def test_gemini_network_failure_falls_back_gracefully(self):
        with patch.object(httpx.Client, "post", side_effect=Exception("Simulated connection timeout")):
            ml_result = {
                "raw_class": "Tomato___Early_blight",
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 92.0,
            }

            result = generate_crop_health_explanation(
                ml_result=ml_result,
                custom_api_key="TEST_FAIL_KEY"
            )

            # Must safely fall back without throwing an exception!
            assert result["is_fallback"] is True
            assert result["isFallback"] is True
            assert "Alternaria solani" in result["summary"]
            assert len(result["what_to_monitor"]) >= 3


class TestExplainEndpointAPI:
    """Test the FastAPI POST /explain/crop-health endpoint handler and route registration."""

    @pytest.fixture(autouse=True)
    def clean_env(self):
        old_val = os.environ.get("GEMINI_API_KEY")
        # Ensure no accidental network calls during unit test
        os.environ["GEMINI_API_KEY"] = ""
        yield
        if old_val is not None:
            os.environ["GEMINI_API_KEY"] = old_val
        else:
            os.environ.pop("GEMINI_API_KEY", None)

    def test_explain_endpoint_route_registration(self):
        """Verify the /explain/crop-health route is properly registered with POST method in FastAPI."""
        route = next((r for r in app.routes if getattr(r, "path", None) == "/explain/crop-health"), None)
        assert route is not None, "Route /explain/crop-health must be registered"
        assert "POST" in route.methods, "POST method must be registered"
        assert route.endpoint == explain_crop_health_endpoint

    def test_explain_endpoint_healthy_prediction(self):
        payload = {
            "crop": "Tomato",
            "disease": "Healthy",
            "confidence": 98.2,
            "severity": "Healthy",
            "severity_status": "healthy",
            "overall_risk": "Low",
            "predicted_yield": 18.2,
            "yield_risk": "Low",
            "farm_context": {
                "fertilizer": 120.0,
                "temp": 24.0,
                "n": 50.0,
                "p": 35.0,
                "k": 25.0
            },
            "weather_context": {
                "temperature": 25.0,
                "humidity": 65.0,
                "location_name": "Guntur, Andhra Pradesh"
            }
        }
        req = ExplainCropHealthRequest(**payload)
        data = explain_crop_health_endpoint(req, x_gemini_api_key=None)

        assert "summary" in data and len(data["summary"]) > 0
        assert "what_it_means" in data and len(data["what_it_means"]) > 0
        assert isinstance(data["what_to_monitor"], list)
        assert isinstance(data["next_steps"], list)
        assert data.get("is_fallback") is True or data.get("isFallback") is True
        assert "0% disease progression" in data["what_it_means"]

    def test_explain_endpoint_diseased_prediction(self):
        payload = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "raw_class": "Tomato___Early_blight",
            "confidence": 89.5,
            "severity": "Mild",
            "severity_status": "graded",
            "overall_risk": "Medium",
            "predicted_yield": 14.0,
            "yield_risk": "Medium"
        }
        req = ExplainCropHealthRequest(**payload)
        data = explain_crop_health_endpoint(req, x_gemini_api_key=None)

        assert "Alternaria solani" in data["summary"] or "Alternaria solani" in data["what_it_means"]
        assert len(data["what_to_monitor"]) >= 3
        assert len(data["next_steps"]) >= 3
        assert data.get("is_fallback") is True or data.get("isFallback") is True

    def test_explain_endpoint_low_confidence_warning(self):
        payload = {
            "crop": "Corn",
            "disease": "Common Rust",
            "raw_class": "Corn_(maize)___Common_rust_",
            "confidence": 55.0,  # Below 70%
            "severity": "Mild",
            "overall_risk": "Medium"
        }
        req = ExplainCropHealthRequest(**payload)
        data = explain_crop_health_endpoint(req, x_gemini_api_key=None)

        assert data["warning"] is not None
        assert "70%" in data["warning"]

    def test_explain_endpoint_security_no_api_key_exposed(self):
        payload = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "confidence": 90.0,
            "custom_api_key": "SECRET_SHOULD_NEVER_BE_ECHOED_IN_RESPONSE"
        }
        req = ExplainCropHealthRequest(**payload)
        data = explain_crop_health_endpoint(req, x_gemini_api_key="HEADER_SECRET_KEY")

        body_text = json.dumps(data)
        # Verify neither key is leaked anywhere in the output
        assert "SECRET_SHOULD_NEVER_BE_ECHOED_IN_RESPONSE" not in body_text
        assert "HEADER_SECRET_KEY" not in body_text

    def test_explain_endpoint_with_mocked_gemini_success(self):
        mock_output = {
            "summary": "AI summary via endpoint",
            "what_it_means": "Detailed AI explanation of Early Blight",
            "what_to_monitor": ["Monitor concentric rings"],
            "next_steps": ["Prune lower leaves"],
            "warning": None,
            "explanation_sections": {}
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": json.dumps(mock_output)}]}}]
        }

        with patch.object(httpx.Client, "post", return_value=mock_resp):
            payload = {
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 90.0,
                "custom_api_key": "MOCK_KEY"
            }
            req = ExplainCropHealthRequest(**payload)
            data = explain_crop_health_endpoint(req, x_gemini_api_key=None)

            assert data.get("is_fallback") is False or data.get("isFallback") is False
            assert data["summary"] == "AI summary via endpoint"


class TestConfidenceHandling:
    """Verify confidence normalization and display formatting across 0-1 and 0-100 scales."""

    def test_normalize_confidence_unit_interval(self):
        assert normalize_confidence(0.94) == 94.0
        assert normalize_confidence(0.945) == 94.5
        assert normalize_confidence(1.0) == 100.0
        assert normalize_confidence(0.55) == 55.0
        assert normalize_confidence(0.0) == 0.0

    def test_normalize_confidence_percentage_scale(self):
        assert normalize_confidence(94.0) == 94.0
        assert normalize_confidence(94.5) == 94.5
        assert normalize_confidence(100.0) == 100.0
        assert normalize_confidence(55.0) == 55.0

    def test_format_confidence_pct(self):
        assert format_confidence_pct(0.94) == "94%"
        assert format_confidence_pct(94.0) == "94%"
        assert format_confidence_pct(0.945) == "94.5%"
        assert format_confidence_pct(94.5) == "94.5%"
        assert format_confidence_pct(1.0) == "100%"
        assert format_confidence_pct(None) == "N/A"

    def test_confidence_0_94_does_not_trigger_low_confidence_warning(self):
        """Specifically verifies that 0.94 normalizes to 94% and does NOT trigger <70% warning."""
        ml_result = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "confidence": 0.94,  # Raw unit interval from prediction or test caller
            "severity": "Mild",
        }
        kb_entry = get_disease_info("Tomato___Early_blight")
        res = generate_grounded_fallback(ml_result, kb_entry)

        # Confidence must display as 94%, NOT 0.9%
        assert "94%" in res["summary"]
        assert "0.9%" not in res["summary"]
        assert "0.9%" not in res["what_it_means"]
        # Must NOT trigger the <70% low confidence warning
        assert res["warning"] is None

    def test_confidence_0_55_triggers_low_confidence_warning(self):
        ml_result = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "confidence": 0.55,  # 55% is below 70%
            "severity": "Mild",
        }
        kb_entry = get_disease_info("Tomato___Early_blight")
        res = generate_grounded_fallback(ml_result, kb_entry)

        assert res["warning"] is not None
        assert "55%" in res["warning"]
        assert "70%" in res["warning"]

    def test_severity_confidence_normalized(self):
        ml_result = {
            "crop": "Tomato",
            "disease": "Early Blight",
            "confidence": 0.95,
            "severity": "Mild",
            "severity_confidence": 0.88,
        }
        kb_entry = get_disease_info("Tomato___Early_blight")
        res = generate_grounded_fallback(ml_result, kb_entry)

        assert "88%" in res["what_it_means"]
        assert "0.9%" not in res["what_it_means"]


class TestGeminiModelConfigAndTimeout:
    """Verify Gemini model selection, timeout handling, and token settings."""

    def test_model_configuration(self):
        assert DEFAULT_GEMINI_MODEL == "gemini-3.5-flash-lite"
        assert CANDIDATE_MODELS == ["gemini-3.5-flash-lite"]
        assert "gemini-2.0-flash" not in CANDIDATE_MODELS
        assert "gemini-3.8-flash" not in CANDIDATE_MODELS

    def test_timeout_configuration(self):
        assert REQUEST_TIMEOUT_SECONDS == 45.0
        assert HTTP_TIMEOUT.read == 45.0
        assert HTTP_TIMEOUT.connect == 15.0

    def test_gemini_read_timeout_falls_back_gracefully(self):
        with patch.object(httpx.Client, "post", side_effect=httpx.ReadTimeout("Timed out after 45s")):
            ml_result = {
                "raw_class": "Tomato___Early_blight",
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 0.94,
            }
            res = generate_crop_health_explanation(ml_result=ml_result, custom_api_key="TEST_KEY")

            assert res["is_fallback"] is True
            assert res["isFallback"] is True
            assert "Read timeout" in res["fallback_reason"] or "timed out" in res["fallback_reason"].lower()
            assert "Alternaria solani" in res["summary"]

    def test_gemini_connect_timeout_falls_back_gracefully(self):
        with patch.object(httpx.Client, "post", side_effect=httpx.ConnectTimeout("Connect timed out")):
            ml_result = {
                "raw_class": "Tomato___Early_blight",
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 0.94,
            }
            res = generate_crop_health_explanation(ml_result=ml_result, custom_api_key="TEST_KEY")

            assert res["is_fallback"] is True
            assert "Connection timeout" in res["fallback_reason"] or "connect timed out" in res["fallback_reason"].lower()

    def test_gemini_invalid_json_falls_back_gracefully(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        # Return invalid JSON text in the parts
        mock_resp.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": "NOT_VALID_JSON{{{"}]}}]
        }

        with patch.object(httpx.Client, "post", return_value=mock_resp):
            ml_result = {
                "raw_class": "Tomato___Early_blight",
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 0.94,
            }
            res = generate_crop_health_explanation(ml_result=ml_result, custom_api_key="TEST_KEY")

            assert res["is_fallback"] is True
            assert "JSON" in res["fallback_reason"]

    def test_token_optimization_and_payload_structure(self):
        mock_ai_output = {
            "summary": "AI summary",
            "what_it_means": "Meaning",
            "what_to_monitor": ["Monitor 1"],
            "next_steps": ["Step 1"],
            "warning": None,
            "explanation_sections": {}
        }
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": json.dumps(mock_ai_output)}]}}]
        }

        with patch.object(httpx.Client, "post", return_value=mock_resp) as mock_post:
            ml_result = {
                "raw_class": "Tomato___Early_blight",
                "crop": "Tomato",
                "disease": "Early Blight",
                "confidence": 0.94,
            }
            generate_crop_health_explanation(ml_result=ml_result, custom_api_key="TEST_KEY")

            assert mock_post.called
            call_kwargs = mock_post.call_args[1]
            json_payload = call_kwargs["json"]

            # Verify generationConfig has maxOutputTokens: 1500
            assert "generationConfig" in json_payload
            assert json_payload["generationConfig"]["maxOutputTokens"] == 1500
            # Verify request URL points to gemini-3.5-flash-lite
            called_url = mock_post.call_args[0][0]
            assert "gemini-3.5-flash-lite" in called_url


if __name__ == "__main__":
    pytest.main(["-v", __file__])
