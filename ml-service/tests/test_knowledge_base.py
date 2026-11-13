"""
Validation tests for CropLens AI Agricultural Disease Knowledge Base (Stage 1)
"""

import os
import json
import pytest
import sys

# Ensure ml-service directory is on python path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.abspath(os.path.join(current_dir, ".."))
if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)

from knowledge_base import (
    DISEASE_KNOWLEDGE_BASE,
    get_disease_info,
    is_healthy_class,
    list_all_classes,
    list_healthy_classes,
    list_disease_classes,
    get_classes_by_category,
)


def load_disease_classes():
    classes_path = os.path.join(ml_service_dir, "models", "disease_classes.json")
    with open(classes_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("classes", [])


def load_severity_mapping():
    mapping_path = os.path.join(ml_service_dir, "models", "severity_disease_mapping.json")
    with open(mapping_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("supported_disease_pairs", [])


class TestKnowledgeBaseCoverage:
    """Verify 100% coverage and exact alignment with trained model classes."""

    def test_total_class_count(self):
        trained_classes = load_disease_classes()
        assert len(trained_classes) == 38, f"Expected 38 model classes, got {len(trained_classes)}"
        assert len(DISEASE_KNOWLEDGE_BASE) == 38, f"Expected 38 knowledge base entries, got {len(DISEASE_KNOWLEDGE_BASE)}"

    def test_every_trained_class_has_kb_entry(self):
        trained_classes = load_disease_classes()
        missing_classes = []
        for cls_name in trained_classes:
            if cls_name not in DISEASE_KNOWLEDGE_BASE:
                missing_classes.append(cls_name)
        assert len(missing_classes) == 0, f"Missing knowledge base entries for classes: {missing_classes}"

    def test_no_extra_unregistered_classes(self):
        trained_classes = set(load_disease_classes())
        kb_classes = set(DISEASE_KNOWLEDGE_BASE.keys())
        extra_classes = kb_classes - trained_classes
        assert len(extra_classes) == 0, f"Found unexpected extra classes in knowledge base: {extra_classes}"


class TestHealthyClassesHandling:
    """Verify healthy classes are distinctly separated and correctly characterized."""

    EXPECTED_HEALTHY = {
        "Apple___healthy",
        "Blueberry___healthy",
        "Cherry_(including_sour)___healthy",
        "Corn_(maize)___healthy",
        "Grape___healthy",
        "Peach___healthy",
        "Pepper,_bell___healthy",
        "Potato___healthy",
        "Raspberry___healthy",
        "Soybean___healthy",
        "Strawberry___healthy",
        "Tomato___healthy",
    }

    def test_healthy_classes_count_and_identification(self):
        healthy_list = list_healthy_classes()
        assert len(healthy_list) == 12, f"Expected 12 healthy classes, found {len(healthy_list)}"
        assert set(healthy_list) == self.EXPECTED_HEALTHY

    def test_healthy_entry_properties(self):
        for raw_class in self.EXPECTED_HEALTHY:
            info = get_disease_info(raw_class)
            assert info is not None, f"Missing entry for {raw_class}"
            assert info["is_healthy"] is True
            assert is_healthy_class(raw_class) is True
            assert info["category"] == "Healthy/Abiotic"
            assert info["causative_pathogen"]["scientific_name"] == "None"
            assert "0%" in info["severity_interpretation"]["mild"] or "healthy" in info["severity_interpretation"]["mild"].lower()

    def test_diseased_classes_not_flagged_healthy(self):
        disease_list = list_disease_classes()
        assert len(disease_list) == 26, f"Expected 26 disease classes, got {len(disease_list)}"
        for raw_class in disease_list:
            info = get_disease_info(raw_class)
            assert info is not None
            assert info["is_healthy"] is False
            assert is_healthy_class(raw_class) is False
            assert info["causative_pathogen"]["scientific_name"] != "None"


class TestAgronomicFieldCompleteness:
    """Verify all entries contain the required structured agronomic data."""

    REQUIRED_TOP_LEVEL_KEYS = [
        "raw_class",
        "crop",
        "disease_name",
        "is_healthy",
        "category",
        "causative_pathogen",
        "overview",
        "favorable_conditions",
        "characteristic_symptoms",
        "transmission_and_spread",
        "prevention_practices",
        "recommended_management",
        "severity_interpretation",
        "professional_advice_triggers",
        "sources",
    ]

    VALID_CATEGORIES = {
        "Fungal",
        "Bacterial",
        "Viral",
        "Oomycete",
        "Pest/Arachnid",
        "Healthy/Abiotic",
    }

    def test_required_keys_and_types_exist_in_all_entries(self):
        for raw_class, entry in DISEASE_KNOWLEDGE_BASE.items():
            for key in self.REQUIRED_TOP_LEVEL_KEYS:
                assert key in entry, f"Missing key '{key}' in entry '{raw_class}'"

            # Check raw_class identity
            assert entry["raw_class"] == raw_class

            # Check category validity
            assert entry["category"] in self.VALID_CATEGORIES, (
                f"Invalid category '{entry['category']}' in '{raw_class}'. Must be one of {self.VALID_CATEGORIES}"
            )

            # Check causative_pathogen structure
            cp = entry["causative_pathogen"]
            assert "scientific_name" in cp and cp["scientific_name"]
            assert "common_name" in cp and cp["common_name"]
            assert "taxonomic_order_family" in cp and cp["taxonomic_order_family"]

            # Check favorable_conditions
            fc = entry["favorable_conditions"]
            assert "temperature_range" in fc and fc["temperature_range"]
            assert "humidity_moisture" in fc and fc["humidity_moisture"]
            assert "key_triggers" in fc and isinstance(fc["key_triggers"], list) and len(fc["key_triggers"]) > 0

            # Check characteristic_symptoms
            cs = entry["characteristic_symptoms"]
            assert "foliar_symptoms" in cs and isinstance(cs["foliar_symptoms"], list) and len(cs["foliar_symptoms"]) > 0
            assert "progression" in cs and cs["progression"]

            # Check transmission_and_spread
            ts = entry["transmission_and_spread"]
            assert "primary_vectors" in ts and isinstance(ts["primary_vectors"], list) and len(ts["primary_vectors"]) > 0
            assert "survival_mechanism" in ts and ts["survival_mechanism"]

            # Check prevention_practices
            pp = entry["prevention_practices"]
            assert isinstance(pp, list) and len(pp) >= 2, f"Expected at least 2 prevention practices in '{raw_class}'"

            # Check recommended_management
            rm = entry["recommended_management"]
            assert "cultural_controls" in rm and isinstance(rm["cultural_controls"], list) and len(rm["cultural_controls"]) > 0
            assert "biological_and_protectant_measures" in rm and isinstance(rm["biological_and_protectant_measures"], list)
            assert "cautionary_dosage_note" in rm and rm["cautionary_dosage_note"]

            # Check severity_interpretation
            si = entry["severity_interpretation"]
            assert "mild" in si and si["mild"]
            assert "severe" in si and si["severe"]

            # Check professional_advice_triggers
            pat = entry["professional_advice_triggers"]
            assert isinstance(pat, list) and len(pat) >= 1, f"Expected at least 1 advice trigger in '{raw_class}'"

            # Check sources
            sources = entry["sources"]
            assert isinstance(sources, list) and len(sources) >= 1, f"Expected at least 1 reference source in '{raw_class}'"
            for src in sources:
                assert "title" in src and src["title"]
                assert "organization" in src and src["organization"]
                assert "url" in src and src["url"].startswith("http")


class TestScientificGroundingAndSafety:
    """Verify botanical accuracy and safety against uncalibrated chemicals."""

    def test_oomycete_classification(self):
        # Late blight must be accurately recognized as Oomycete, not Fungal
        potato_lb = get_disease_info("Potato___Late_blight")
        tomato_lb = get_disease_info("Tomato___Late_blight")
        assert potato_lb["category"] == "Oomycete"
        assert tomato_lb["category"] == "Oomycete"
        assert "Phytophthora infestans" in potato_lb["causative_pathogen"]["scientific_name"]
        assert "Phytophthora infestans" in tomato_lb["causative_pathogen"]["scientific_name"]

    def test_bacterial_classification(self):
        bacterial_classes = [
            "Orange___Haunglongbing_(Citrus_greening)",
            "Peach___Bacterial_spot",
            "Pepper,_bell___Bacterial_spot",
            "Tomato___Bacterial_spot",
        ]
        for b_cls in bacterial_classes:
            info = get_disease_info(b_cls)
            assert info["category"] == "Bacterial", f"Expected Bacterial category for {b_cls}"

    def test_viral_classification(self):
        viral_classes = [
            "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
            "Tomato___Tomato_mosaic_virus",
        ]
        for v_cls in viral_classes:
            info = get_disease_info(v_cls)
            assert info["category"] == "Viral", f"Expected Viral category for {v_cls}"

    def test_pest_classification(self):
        mite_info = get_disease_info("Tomato___Spider_mites Two-spotted_spider_mite")
        assert mite_info["category"] == "Pest/Arachnid"
        assert "Tetranychus urticae" in mite_info["causative_pathogen"]["scientific_name"]

    def test_safety_cautionary_disclaimer_present(self):
        for raw_class, entry in DISEASE_KNOWLEDGE_BASE.items():
            caution = entry["recommended_management"]["cautionary_dosage_note"]
            assert len(caution) > 20, f"Cautionary note missing or too short in {raw_class}"


class TestSeverityModelMappingConsistency:
    """Verify Stage 2 severity model supported pairs align with knowledge base."""

    def test_supported_severity_disease_pairs_exist(self):
        pairs = load_severity_mapping()
        assert len(pairs) == 14, f"Expected 14 supported disease pairs in mapping, got {len(pairs)}"
        for pair in pairs:
            stage1_match = pair.get("stage1_match")
            # If the stage1_match is in the 38 classes, verify it exists in KB
            if stage1_match in DISEASE_KNOWLEDGE_BASE:
                kb_entry = get_disease_info(stage1_match)
                assert kb_entry is not None
                assert kb_entry["is_healthy"] is False


if __name__ == "__main__":
    pytest.main(["-v", __file__])

