"""
CropLens AI - All-38 Crop Pathology Class Coverage Test
Validates that every single class in disease_classes.json (all 26 diseased + 12 healthy)
across all 14 crops resolves correctly and returns a rich, grounded explanation.
"""

import os
import json
import pytest
import sys
from unittest.mock import MagicMock

# Set up paths and torch mocks if running on system Python without CUDA
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.abspath(os.path.join(current_dir, ".."))
workspace_dir = os.path.abspath(os.path.join(ml_service_dir, ".."))
kaggle_site_packages = os.path.join(workspace_dir, "kaggle-env", "Lib", "site-packages")

if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)
if os.path.exists(kaggle_site_packages) and kaggle_site_packages not in sys.path:
    sys.path.append(kaggle_site_packages)

try:
    import torch
except (ImportError, OSError):
    sys.modules["torch"] = MagicMock()
    sys.modules["torch.nn"] = MagicMock()
    sys.modules["torchvision"] = MagicMock()
    sys.modules["torchvision.models"] = MagicMock()
    sys.modules["torchvision.transforms"] = MagicMock()

from main import app, explain_crop_health_endpoint, ExplainCropHealthRequest
from gemini_service import generate_crop_health_explanation, resolve_knowledge_base_entry
from knowledge_base import DISEASE_KNOWLEDGE_BASE, get_disease_info

# Load canonical 38 classes
classes_path = os.path.join(ml_service_dir, "models", "disease_classes.json")
with open(classes_path, "r", encoding="utf-8") as f:
    ALL_38_CLASSES = json.load(f)["classes"]

EXPECTED_CROPS = {
    "Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange",
    "Peach", "Pepper", "Potato", "Raspberry", "Soybean", "Squash",
    "Strawberry", "Tomato"
}


class TestAll38ClassCoverage:
    """Verify end-to-end explanation generation for all 38 classifier classes."""

    def test_total_class_count_is_38(self):
        assert len(ALL_38_CLASSES) == 38

    @pytest.mark.parametrize("raw_class", ALL_38_CLASSES)
    def test_every_single_class_resolves_and_generates_valid_explanation(self, raw_class):
        kb_class, kb_entry = resolve_knowledge_base_entry(raw_class=raw_class)
        assert kb_class == raw_class, f"Failed resolving {raw_class}"
        assert kb_entry is not None, f"Knowledge base missing entry for {raw_class}"

        crop_name = kb_entry["crop"]
        disease_name = kb_entry["disease_name"]
        is_healthy = kb_entry["is_healthy"]

        # Call endpoint logic with representative ML result
        req = ExplainCropHealthRequest(
            crop=crop_name,
            predicted_crop=crop_name,
            disease=disease_name,
            raw_class=raw_class,
            confidence=94.5,
            severity="Healthy" if is_healthy else "Mild",
            severity_status="healthy" if is_healthy else "graded",
            overall_risk="Low" if is_healthy else "Medium",
            predicted_yield=16.0,
            yield_risk="Low"
        )
        explanation = explain_crop_health_endpoint(req, x_gemini_api_key=None)

        # Assert mandatory high-level fields
        assert explanation["summary"] is not None and len(explanation["summary"]) > 0
        assert explanation["what_it_means"] is not None and len(explanation["what_it_means"]) > 0
        assert isinstance(explanation["what_to_monitor"], list)
        assert len(explanation["what_to_monitor"]) >= 2
        assert isinstance(explanation["next_steps"], list)
        assert len(explanation["next_steps"]) >= 2

        # Assert detailed explanation sections
        secs = explanation.get("explanation_sections", {})
        assert "disease_overview" in secs and len(secs["disease_overview"]) > 0
        assert "causative_pathogen" in secs
        assert "favorable_conditions" in secs
        assert "characteristic_symptoms" in secs
        assert "transmission_and_spread" in secs
        assert "prevention_practices" in secs
        assert "recommended_management" in secs

        # Healthy vs Diseased specific assertions
        if is_healthy:
            assert secs["causative_pathogen"]["scientific_name"] == "None"
            assert "0% disease progression" in explanation["what_it_means"]
            assert "no agrochemical treatment" in secs["recommended_management"]["cautionary_dosage_note"].lower()
        else:
            assert secs["causative_pathogen"]["scientific_name"] != "None"
            assert len(secs["causative_pathogen"]["scientific_name"]) > 3
            assert "cautionary_dosage_note" in secs["recommended_management"]

    def test_all_14_crops_represented(self):
        crops_found = set()
        for raw_class in ALL_38_CLASSES:
            kb_class, kb_entry = resolve_knowledge_base_entry(raw_class=raw_class)
            crop_name = kb_entry["crop"]
            # Normalize crop name for matching
            matched = False
            for ec in EXPECTED_CROPS:
                if ec.lower() in crop_name.lower():
                    crops_found.add(ec)
                    matched = True
                    break
            assert matched, f"Unexpected crop '{crop_name}' for class '{raw_class}'"

        assert crops_found == EXPECTED_CROPS, f"Missing crops: {EXPECTED_CROPS - crops_found}"

    def test_healthy_only_crops_do_not_have_fictional_diseases(self):
        """Verify that crops which only have healthy classes in the dataset are treated cleanly."""
        healthy_only_crops = ["Blueberry", "Raspberry", "Soybean"]
        for hoc in healthy_only_crops:
            hoc_classes = [c for c in ALL_38_CLASSES if c.startswith(hoc)]
            assert len(hoc_classes) == 1
            assert hoc_classes[0] == f"{hoc}___healthy"

    def test_unknown_or_unsupported_crop_fails_safely(self):
        """Verify unsupported crops produce a safe fallback without crashing."""
        req = ExplainCropHealthRequest(
            crop="Dragonfruit",
            disease="Stem Canker",
            raw_class="Dragonfruit___stem_canker",
            confidence=85.0
        )
        res = explain_crop_health_endpoint(req, x_gemini_api_key=None)
        assert res["is_fallback"] is True
        assert "Dragonfruit" in res["summary"]
        assert len(res["what_to_monitor"]) >= 2
        assert len(res["next_steps"]) >= 2

