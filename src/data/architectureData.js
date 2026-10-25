/**
 * CropLens AI — System Architecture Specification & Data Model
 * 
 * Accurately models the exact multi-stage agronomic pipeline:
 * 1. Multi-Input Branching (Leaf Image, Soil/Farm Parameters, Location)
 * 2. MobileNetV2 Disease Classification (38 classes)
 * 3. Disease-Conditioned MobileNetV2 Severity Assessment (14 supported pairs)
 * 4. Random Forest Tabular Yield Regressor
 * 5. Deterministic Rule-Based Multi-Signal Risk Fusion
 * 6. Live Open-Meteo Environmental Context (Non-ML)
 * 7. Grounded Gemini 3.8 Flash Agronomic Explainer (with deterministic fallback)
 * 8. SpeechSynthesis Voice Accessibility
 * 9. Unified Crop Health Report
 */

export const ARCHITECTURE_GROUPS = [
  { id: '01', key: 'INPUT', label: '01 INPUT', title: 'Data Ingestion & Multi-Source Routing' },
  { id: '02', key: 'VISION', label: '02 COMPUTER VISION', title: 'Leaf Validation & Disease Inference' },
  { id: '03', key: 'SEVERITY', label: '03 SEVERITY', title: 'Conditioned Severity Routing' },
  { id: '04', key: 'YIELD', label: '04 YIELD', title: 'Soil & Climate Yield Estimation' },
  { id: '05', key: 'RISK', label: '05 RISK', title: 'Deterministic Multi-Signal Fusion' },
  { id: '06', key: 'CONTEXT', label: '06 CONTEXT', title: 'Live Meteorological Context' },
  { id: '07', key: 'AI', label: '07 AI & VOICE', title: 'Grounded LLM Explainer & Speech' },
  { id: '08', key: 'OUTPUT', label: '08 OUTPUT', title: 'Unified Crop Health Report Card' },
];

export const ARCHITECTURE_NODES = {
  // --- 01 INPUT BRANCHES ---
  leaf_input: {
    id: 'leaf_input',
    groupId: '01',
    groupName: 'INPUT',
    title: 'Leaf Image Upload',
    shortLabel: 'Leaf Photo',
    badge: 'Input Stream A',
    techType: 'input',
    iconName: 'Camera',
    stageNumber: null,
    summary: 'High-resolution RGB photograph of a suspect leaf captured via smartphone camera or uploaded from storage.',
    purpose: 'Provides visual foliage symptoms (lesions, discoloration, fungal spots) to the computer vision pipeline.',
    inputs: [
      { name: 'Image File', type: 'JPG / PNG / WEBP', desc: 'Smartphone camera or gallery capture' },
      { name: 'Resolution', type: 'Min 224×224 px', desc: 'Adequate detail for lesion feature extraction' },
    ],
    outputs: [
      { name: 'Raw Image Stream', type: 'Binary Blob', desc: 'Routed strictly to Computer Vision branch' },
    ],
    dataset: 'User / Farmer on-site capture',
    limitation: 'Extreme blur, harsh specular glare, or severe background clutter can degrade downstream classifier confidence.',
    details: {
      'Target Subsystem': 'Vision Pipeline (Image Validation → Disease Model)',
      'Data Isolation': 'Does NOT feed directly to Yield or Weather subsystems',
      'Format Handling': 'Handled via HTML5 File API & multipart/form-data',
    },
    sampleData: {
      filename: 'tomato_early_blight_sample.png',
      mime_type: 'image/png',
      size_kb: 142.6,
      dimensions: '256x256 RGB',
    },
    targetNodeIds: ['image_validation'],
    sourceNodeIds: [],
  },

  soil_input: {
    id: 'soil_input',
    groupId: '01',
    groupName: 'INPUT',
    title: 'Soil & Farm Parameters',
    shortLabel: 'Farm Parameters',
    badge: 'Input Stream B',
    techType: 'input',
    iconName: 'Sliders',
    stageNumber: null,
    summary: 'Agronomic soil nutrient levels, ambient field temperature, and applied chemical or organic fertilizer rates.',
    purpose: 'Feeds tabular crop productivity models independently from visual leaf inspection.',
    inputs: [
      { name: 'Nitrogen (N)', type: '0 - 140 kg/ha', desc: 'Primary vegetative nutrient level' },
      { name: 'Phosphorus (P)', type: '5 - 145 kg/ha', desc: 'Root development nutrient level' },
      { name: 'Potassium (K)', type: '5 - 205 kg/ha', desc: 'Disease resistance and vigor nutrient' },
      { name: 'Fertilizer Rate', type: 'kg/ha applied', desc: 'Applied soil amendment volume' },
      { name: 'Field Temperature', type: '°C', desc: 'Local seasonal growing temperature' },
    ],
    outputs: [
      { name: 'Tabular Feature Vector', type: 'Float[5]', desc: 'Routed strictly to Random Forest Yield model' },
    ],
    dataset: 'Farmer input, soil testing card, or sensor logs',
    limitation: 'Tabular inputs reflect general soil fertility potential rather than real-time biological uptake.',
    details: {
      'Target Subsystem': 'Yield Regressor (Random Forest)',
      'Data Isolation': 'Does NOT alter visual convolutional neural net weights',
      'Standardized Bounds': 'Min-Max bounded to prevent numerical instability',
    },
    sampleData: {
      nitrogen: '40.0 kg/ha',
      phosphorus: '30.0 kg/ha',
      potassium: '20.0 kg/ha',
      fertilizer: '120.5 kg/ha',
      temperature: '24.5 °C',
    },
    targetNodeIds: ['yield_predictor'],
    sourceNodeIds: [],
  },

  geo_input: {
    id: 'geo_input',
    groupId: '01',
    groupName: 'INPUT',
    title: 'Farm Geographic Location',
    shortLabel: 'Location',
    badge: 'Input Stream C',
    techType: 'input',
    iconName: 'CloudSun',
    stageNumber: null,
    summary: 'Village, district, or geographic coordinates specifying the farm location.',
    purpose: 'Queries live meteorological data from Open-Meteo REST API for localized agronomic context.',
    inputs: [
      { name: 'Location Query', type: 'Text / Geocode', desc: 'e.g., Guntur, Andhra Pradesh or coordinates' },
    ],
    outputs: [
      { name: 'Geo Query', type: 'Lat / Lon String', desc: 'Routed strictly to Open-Meteo Weather API' },
    ],
    dataset: 'Farmer profile or device geocoding',
    limitation: 'Resolution depends on regional public meteorological stations (typically 2-10 km grid resolution).',
    details: {
      'Target Subsystem': 'Open-Meteo Weather Service',
      'Data Isolation': 'Non-ML contextual stream; does not affect model classification',
    },
    sampleData: {
      query: 'Guntur, Andhra Pradesh',
      latitude: 16.3067,
      longitude: 80.4365,
    },
    targetNodeIds: ['environmental_context'],
    sourceNodeIds: [],
  },

  // --- 02 COMPUTER VISION ---
  image_validation: {
    id: 'image_validation',
    groupId: '02',
    groupName: 'COMPUTER VISION',
    title: 'Image Validation & Preprocessing',
    shortLabel: '01 Image Check',
    badge: 'OpenCV / TorchVision',
    techType: 'deterministic',
    iconName: 'CheckCircle2',
    stageNumber: 1,
    summary: 'Sanity validation, format verification, leaf boundary checks, aspect ratio confirmation, and ImageNet standardization.',
    purpose: 'Guarantees uploaded image bytes are uncorrupted, safely formatted, and standardized before tensor creation.',
    inputs: [
      { name: 'Raw Image Bytes', type: 'Binary', desc: 'Stream from client upload' },
    ],
    outputs: [
      { name: 'Normalized Tensor', type: 'Float32[3, 224, 224]', desc: 'Normalized with μ=[0.485,0.456,0.406], σ=[0.229,0.224,0.225]' },
      { name: 'Integrity Status', type: 'Boolean / String', desc: 'Validation pass or explicit client error code' },
    ],
    dataset: 'Standard TorchVision ImageNet normalization pipeline',
    limitation: 'Does not perform full semantic segmentation of non-plant background objects (rocks, fingers, soil).',
    details: {
      'Execution Latency': '12 - 25 ms',
      'Tensor Shape': '(1, 3, 224, 224)',
      'Memory Overhead': '< 2.5 MB',
    },
    sampleData: {
      valid: true,
      channels: 3,
      size: [224, 224],
      dtype: 'torch.float32',
      mean_normalized: true,
    },
    targetNodeIds: ['disease_classifier'],
    sourceNodeIds: ['leaf_input'],
  },

  disease_classifier: {
    id: 'disease_classifier',
    groupId: '02',
    groupName: 'COMPUTER VISION',
    title: 'Disease Classification Model',
    shortLabel: '02 Disease Model',
    badge: 'MobileNetV2 (38 Classes)',
    techType: 'neural-net',
    iconName: 'Cpu',
    stageNumber: 2,
    summary: 'Lightweight deep convolutional neural network with depthwise separable convolutions trained over 38 crop-disease categories.',
    purpose: 'Classifies visual leaf pathology into high-confidence crop identity, disease name, and top-1 confidence score.',
    inputs: [
      { name: 'Preprocessed Tensor', type: 'Tensor[1, 3, 224, 224]', desc: 'Output from Image Validation' },
    ],
    outputs: [
      { name: 'Predicted Crop', type: 'String', desc: 'e.g., Tomato, Potato, Apple, Corn' },
      { name: 'Disease Class', type: 'String', desc: 'e.g., Early Blight, Late Blight, Healthy' },
      { name: 'Confidence Score', type: 'Float (0 - 100%)', desc: 'Softmax probability of predicted class' },
      { name: 'Top-3 Predictions', type: 'Array[{class, prob}]', desc: 'Secondary candidate differential diagnosis' },
    ],
    dataset: 'PlantVillage & New Plant Diseases dataset (87,000+ controlled laboratory leaf images across 14 crops and 26 diseases).',
    limitation: 'Controlled-image validation does not guarantee identical field performance under natural sunlight, shadows, or multiple co-occurring pathogens.',
    details: {
      'Architecture': 'MobileNetV2 (Depthwise Separable CNN)',
      'Classes': '38 crop-disease classes',
      'Model Weight File': 'plant_disease_model.pth (approx 9 MB)',
      'Inference Engine': 'PyTorch CPU / OpenVINO / Intel Arc GPU acceleration',
      'Typical Latency': '35 - 65 ms',
    },
    sampleData: {
      predicted_crop: 'Tomato',
      disease: 'Early Blight',
      raw_class: 'Tomato___Early_blight',
      confidence: 99.2,
      top3: [
        { class: 'Tomato___Early_blight', confidence: 99.2 },
        { class: 'Tomato___Late_blight', confidence: 0.6 },
        { class: 'Tomato___healthy', confidence: 0.1 },
      ],
    },
    targetNodeIds: ['severity_assessor', 'risk_fusion'],
    sourceNodeIds: ['image_validation'],
  },

  // --- 03 SEVERITY ASSESSMENT ---
  severity_assessor: {
    id: 'severity_assessor',
    groupId: '03',
    groupName: 'SEVERITY',
    title: 'Conditioned Severity Routing & Assessment',
    shortLabel: '03 Severity Model',
    badge: 'Disease-Conditioned MobileNetV2',
    techType: 'neural-net',
    iconName: 'Activity',
    stageNumber: 3,
    summary: 'Specialized secondary vision model conditioned on the identified crop-disease class to evaluate lesion spread (Mild vs Severe).',
    purpose: 'Quantifies infection progress into actionable grades to determine intervention urgency.',
    inputs: [
      { name: 'Leaf Tensor', type: 'Tensor[1, 3, 224, 224]', desc: 'Normalized image tensor' },
      { name: 'Predicted Disease', type: 'String ID', desc: 'Crop-disease class output from Stage 02' },
    ],
    outputs: [
      { name: 'Severity Level', type: 'Enum', desc: 'Mild / Severe / Single-stage / Healthy / Unavailable' },
      { name: 'Severity Confidence', type: 'Float (0 - 100%)', desc: 'Model confidence in grading' },
      { name: 'Severity Support Flag', type: 'Boolean', desc: 'Whether this disease has an explicit grading model' },
    ],
    dataset: 'AI Challenger 2018 clean leakage-controlled split with explicit agricultural severity annotations.',
    limitation: 'The trained model explicitly supports 14 severity-graded crop-disease pairs. Other diseases receive Single-stage or Unavailable rather than forced artificial grades.',
    details: {
      'Conditioned Routing': '14 Supported Pairs → Dual-class Mild/Severe; Healthy → Not required; Others → Single-stage',
      'Supported Examples': 'Tomato Early Blight, Tomato Late Blight, Apple Scab, Grape Black Rot, Corn Blight',
      'Model Weight File': 'severity_model.pth',
      'Typical Latency': '30 - 55 ms',
    },
    sampleData: {
      severity: 'Mild',
      severity_confidence: 64.5,
      is_supported: true,
      routing_path: 'dual_class_explicit',
      lesion_coverage_estimate: '12 - 20% leaf area',
    },
    targetNodeIds: ['risk_fusion'],
    sourceNodeIds: ['disease_classifier'],
  },

  // --- 04 YIELD PREDICTION ---
  yield_predictor: {
    id: 'yield_predictor',
    groupId: '04',
    groupName: 'YIELD',
    title: 'Soil & Climate Yield Model',
    shortLabel: '04 Yield Model',
    badge: 'Random Forest Regressor',
    techType: 'tabular-ml',
    iconName: 'TrendingUp',
    stageNumber: 4,
    summary: 'Trained tabular ensemble regressor analyzing non-visual soil chemistry, ambient temperature, and fertilizer application.',
    purpose: 'Estimates projected crop yield and identifies yield stress risk from soil nutrient imbalances or suboptimal fertilization.',
    inputs: [
      { name: 'Soil Nitrogen (N)', type: 'Float (kg/ha)', desc: 'From Farm Parameters stream' },
      { name: 'Soil Phosphorus (P)', type: 'Float (kg/ha)', desc: 'From Farm Parameters stream' },
      { name: 'Soil Potassium (K)', type: 'Float (kg/ha)', desc: 'From Farm Parameters stream' },
      { name: 'Applied Fertilizer', type: 'Float (kg/ha)', desc: 'From Farm Parameters stream' },
      { name: 'Field Temperature', type: 'Float (°C)', desc: 'From Farm Parameters stream' },
    ],
    outputs: [
      { name: 'Expected Yield', type: 'Float (t/ha)', desc: 'Predicted harvest yield in tons per hectare' },
      { name: 'Baseline Comparison', type: 'Float (t/ha)', desc: 'Regional benchmark yield comparison' },
      { name: 'Yield Risk Level', type: 'Low / Medium / High', desc: 'Quantified penalty risk from nutrient stress' },
    ],
    dataset: 'Historical multi-season agronomic crop productivity trials and soil fertilizer response datasets.',
    limitation: 'Crop identity is NOT a training feature; models tabular soil/temperature/fertilizer productivity response, not universal crop-specific physiology.',
    details: {
      'Algorithm': 'Random Forest Regressor (100 Decision Trees)',
      'Feature Set': '[Temperature, N, P, K, Fertilizer]',
      'Model Serialization': 'crop_yield_model.pkl (Joblib / Scikit-Learn)',
      'Typical Latency': '4 - 8 ms',
    },
    sampleData: {
      predicted_yield_tha: 11.82,
      baseline_yield_tha: 12.50,
      yield_risk: 'Medium',
      limiting_factor: 'Sub-optimal Potassium (K) ratio',
      confidence_interval: '± 0.85 t/ha',
    },
    targetNodeIds: ['risk_fusion'],
    sourceNodeIds: ['soil_input'],
  },

  // --- 05 RISK FUSION ---
  risk_fusion: {
    id: 'risk_fusion',
    groupId: '05',
    groupName: 'RISK',
    title: 'Deterministic Multi-Signal Risk Fusion',
    shortLabel: '05 Risk Fusion',
    badge: 'Deterministic Rule Engine',
    techType: 'deterministic',
    iconName: 'ShieldAlert',
    stageNumber: 5,
    summary: 'Deterministic multi-signal decision matrix that combines visual disease presence, severity status, and yield risk into a unified risk tier.',
    purpose: 'Delivers a transparent, safety-critical overall farm risk score without opaque black-box deep learning uncertainty.',
    inputs: [
      { name: 'Disease Class & Confidence', type: 'Output of Stage 02', desc: 'Pathogen identity and probability' },
      { name: 'Severity Level', type: 'Output of Stage 03', desc: 'Mild / Severe / Single-stage / Healthy' },
      { name: 'Yield Risk Category', type: 'Output of Stage 04', desc: 'Low / Medium / High soil yield risk' },
    ],
    outputs: [
      { name: 'Overall Farm Risk', type: 'Low / Medium / High', desc: 'Unified farm management priority' },
      { name: 'Urgency Flag', type: 'Immediate / Moderate / Routine', desc: 'Recommended farmer intervention timeline' },
      { name: 'Risk Breakdown Vector', type: 'Object', desc: 'Component weights and contribution factors' },
    ],
    dataset: 'Deterministic agricultural advisory decision matrices (ICAR / FAO guidelines).',
    limitation: 'Intentionally rule-based rather than a neural network. Designed for high traceability, auditability, and safety.',
    details: {
      'Logic Type': 'Rule-based multi-signal decision table',
      'High Risk Triggers': 'Severe disease OR (Mild disease + High yield risk)',
      'Low Risk Triggers': 'Healthy crop AND Low yield risk',
      'Execution Latency': '< 2 ms',
    },
    sampleData: {
      overall_risk: 'Medium',
      urgency: 'Action recommended within 48-72 hours',
      breakdown: {
        pathology_weight: 'Mild Early Blight (+1.5)',
        soil_risk_weight: 'Medium Yield Risk (+1.0)',
        final_score: '2.5 / 5.0 (Medium Tier)',
      },
    },
    targetNodeIds: ['ai_assistant'],
    sourceNodeIds: ['disease_classifier', 'severity_assessor', 'yield_predictor'],
  },

  // --- 06 ENVIRONMENTAL CONTEXT ---
  environmental_context: {
    id: 'environmental_context',
    groupId: '06',
    groupName: 'CONTEXT',
    title: 'Live Meteorological Context',
    shortLabel: '06 Weather Context',
    badge: 'Open-Meteo REST API',
    techType: 'api',
    iconName: 'CloudSun',
    stageNumber: 6,
    summary: 'Queries live, hyper-local meteorological observations based on the farm location.',
    purpose: 'Provides environmental humidity and temperature context that governs pathogen spore development and spray timing.',
    inputs: [
      { name: 'Farm Location Query', type: 'Geocode / Text', desc: 'From Farm Location stream' },
    ],
    outputs: [
      { name: 'Ambient Temperature', type: 'Float (°C)', desc: 'Current dry-bulb temperature' },
      { name: 'Relative Humidity', type: 'Float (%)', desc: 'Critical for fungal germination risk' },
      { name: 'Precipitation', type: 'Float (mm)', desc: 'Recent rainfall and rain forecast' },
      { name: 'Wind Speed', type: 'Float (km/h)', desc: 'Governs safe spray drift conditions' },
    ],
    dataset: 'Open-Meteo Global Weather Models (ERA5 / GFS / ECMWF observational feeds).',
    limitation: 'CONTEXTUAL ONLY — NON-ML. Purely an external contextual feed. Does NOT train models or override disease classification.',
    details: {
      'Service Provider': 'Open-Meteo REST API (Free & Open Source)',
      'Classification Impact': 'Zero (Non-ML context)',
      'Agronomic Value': 'Guides fungicide spray timing and dew period assessment',
      'Query Latency': '120 - 350 ms',
    },
    sampleData: {
      status: 'success',
      temperature_c: 28.4,
      relative_humidity_pct: 78,
      precipitation_mm: 1.2,
      wind_speed_kmh: 11.4,
      spore_condition: 'High humidity favors Alternaria solani incubation',
    },
    targetNodeIds: ['ai_assistant'],
    sourceNodeIds: ['geo_input'],
  },

  // --- 07 AI ASSISTANT & VOICE ---
  ai_assistant: {
    id: 'ai_assistant',
    groupId: '07',
    groupName: 'AI',
    title: 'Grounded Agronomic AI Explainer',
    shortLabel: '07 AI Assistant',
    badge: 'Gemini 3.8 Flash + Fallback',
    techType: 'llm',
    iconName: 'Sparkles',
    stageNumber: 7,
    summary: 'LLM explanation layer that translates structured ML diagnostic outputs into clear, conversational advice and spray recommendations.',
    purpose: 'Explains complex multi-signal inference results in plain farmer-friendly language with actionable recovery steps.',
    inputs: [
      { name: 'Verified ML Outputs', type: 'JSON Struct', desc: 'Disease, Confidence, Severity, Yield, and Risk vectors' },
      { name: 'Weather Context', type: 'JSON Struct', desc: 'Current temperature, humidity, and rainfall' },
    ],
    outputs: [
      { name: 'Executive Summary', type: 'Markdown Text', desc: 'Plain-language interpretation of condition' },
      { name: 'Key Causal Factors', type: 'Array[String]', desc: 'Agronomic explanation of symptoms' },
      { name: 'Immediate Actions', type: 'Array[String]', desc: 'Curative copper or bio-fungicide measures' },
      { name: 'Preventive Measures', type: 'Array[String]', desc: 'Pruning, drip irrigation, crop rotation' },
    ],
    dataset: 'Gemini 3.8 Flash model fine-tuned on general reasoning, grounded with agricultural agronomy system prompts.',
    limitation: 'Gemini is an EXPLANATION LAYER, not the primary disease classifier. It receives structured ML outputs and does NOT diagnose raw images directly or override ML predictions.',
    details: {
      'Primary Engine': 'Google Gemini 3.8 Flash',
      'Fallback Engine': 'Deterministic Basic Mode (Grounded rule templates if API is unavailable)',
      'Prompt Isolation': 'Pre-conditioned strictly with ML JSON outputs',
      'Typical Latency': '800 - 1800 ms',
    },
    sampleData: {
      model_used: 'gemini-3.8-flash',
      mode: 'grounded_explanation',
      summary: 'Your Tomato crop shows mild symptoms of Early Blight (Alternaria solani). Combined with current 78% humidity, prompt treatment will protect your expected 11.82 t/ha yield.',
      recommendation: 'Apply copper hydroxide or chlorothalonil spray during morning hours before wind exceeds 15 km/h.',
    },
    targetNodeIds: ['voice_synthesis', 'crop_health_report'],
    sourceNodeIds: ['risk_fusion', 'environmental_context'],
  },

  voice_synthesis: {
    id: 'voice_synthesis',
    groupId: '07',
    groupName: 'AI',
    title: 'Browser Voice Synthesis',
    shortLabel: '08 Voice Readout',
    badge: 'Web Speech API',
    techType: 'deterministic',
    iconName: 'Volume2',
    stageNumber: 8,
    summary: 'Client-side text-to-speech engine reading the agronomic diagnosis and recovery plan aloud.',
    purpose: 'Ensures accessibility for farmers with limited literacy or those working hands-free in the field.',
    inputs: [
      { name: 'AI Explanation Text', type: 'Plain Text', desc: 'Summary and key actions from Stage 07' },
    ],
    outputs: [
      { name: 'Audio Output', type: 'Speech Stream', desc: 'Spoken through device speaker' },
    ],
    dataset: 'Browser-native Web Speech Synthesis engine',
    limitation: 'Voice quality, timbre, and accent support depend on the user device operating system.',
    details: {
      'Technology': 'window.speechSynthesis',
      'Execution': 'Local client-side execution (zero cloud latency)',
      'Language Support': 'English, with browser localized voice fallback',
    },
    sampleData: {
      state: 'idle',
      speechRate: 0.95,
      pitch: 1.0,
      readout_preview: '"CropLens Diagnostic Report: Tomato Early Blight detected with 99.2 percent confidence..."',
    },
    targetNodeIds: ['crop_health_report'],
    sourceNodeIds: ['ai_assistant'],
  },

  // --- 08 FINAL OUTPUT ---
  crop_health_report: {
    id: 'crop_health_report',
    groupId: '08',
    groupName: 'OUTPUT',
    title: 'Unified Crop Health Report Card',
    shortLabel: '09 Final Report',
    badge: 'Integrated Diagnostic Report',
    techType: 'output',
    iconName: 'FileText',
    stageNumber: 9,
    summary: 'The final, cohesive diagnostic deliverable synthesizing disease identification, severity grading, yield prognosis, risk tier, live weather, and actionable AI guidance.',
    purpose: 'Provides the farmer with an authoritative, easy-to-understand agronomic report card to save crops and preserve harvest yields.',
    inputs: [
      { name: 'All Upstream Stages', type: 'Unified JSON', desc: 'Vision + Severity + Yield + Risk + Weather + AI + Voice' },
    ],
    outputs: [
      { name: 'Interactive Report View', type: 'UI Dashboard', desc: 'Complete interactive cards, badges, and charts' },
      { name: 'Printable / PDF Export', type: 'Document', desc: 'Shareable report for agricultural extension officers' },
    ],
    dataset: 'Synthesized directly from live ML inference pipeline execution',
    limitation: 'Actionable guidance serves as agronomic decision support and should be verified with local agricultural extension specialists.',
    details: {
      'Presentation': 'Full diagnostic dashboard view',
      'Interactive Controls': 'Audio playback, print report, retry scan, auto-detect crop',
      'Total Pipeline Time': 'Approx 220 - 450 ms (ML models) + LLM streaming',
    },
    sampleData: {
      disease: 'Tomato Early Blight (99.2%)',
      severity: 'Mild (64.5% confidence)',
      expected_yield: '11.82 t/ha (Baseline 12.50)',
      overall_risk: 'Medium Risk',
      weather_summary: '28.4°C, 78% Humidity',
      ai_status: 'Gemini 3.8 Flash Guided Plan Active',
    },
    targetNodeIds: [],
    sourceNodeIds: ['ai_assistant', 'voice_synthesis', 'risk_fusion'],
  },
};

// Complete ordered walkthrough sequence (9 distinct stages)
export const WALKTHROUGH_STAGES = [
  'image_validation',
  'disease_classifier',
  'severity_assessor',
  'yield_predictor',
  'risk_fusion',
  'environmental_context',
  'ai_assistant',
  'voice_synthesis',
  'crop_health_report',
];

// Key architectural notes for Viva, College IDP presentations, and technical reviewers
export const ARCHITECTURE_NOTES = [
  {
    topic: 'Computer Vision (MobileNetV2)',
    badge: 'Vision Backbone',
    summary: 'Why MobileNetV2 instead of heavier architectures?',
    description: 'MobileNetV2 utilizes depthwise separable convolutions and inverted residual bottlenecks, delivering 3.4M parameters compared to ResNet-50’s 25M+. This permits sub-60ms inference on low-cost edge servers or local CPU without sacrificing classification accuracy across the 38 plant disease classes.',
  },
  {
    topic: 'Conditioned Severity Routing',
    badge: 'Specialized Routing',
    summary: 'Why conditioned routing instead of a monolithic multi-task head?',
    description: 'Severity grading is biologically distinct per disease (e.g. leaf spot lesion density vs powdery mildew white mycelial coverage). By conditioning the severity model on the 14 explicitly annotated crop-disease pairs in AI Challenger 2018, the system avoids forced false severity classifications on single-stage or healthy leaves.',
  },
  {
    topic: 'Tabular Yield Regressor',
    badge: 'Ensemble Learning',
    summary: 'Why Random Forest with soil N-P-K instead of a CNN?',
    description: 'Crop yield is primarily governed by soil nutrient balance, fertilizer inputs, and ambient thermal units, which are tabular agricultural vectors rather than optical features. A 100-tree Random Forest Regressor captures non-linear nutrient interactions without overfitting.',
  },
  {
    topic: 'Deterministic Risk Fusion',
    badge: 'Safety-Critical',
    summary: 'Why deterministic rule matrices instead of a neural risk network?',
    description: 'In agricultural decision support, liability and auditability are critical. If a farmer is advised to spray or withhold fungicide, the system must explain the exact rule trigger. The multi-signal fusion combines Disease Confidence, Severity Grade, and Yield Risk deterministically.',
  },
  {
    topic: 'Role of Gemini 3.8 Flash',
    badge: 'Grounded LLM',
    summary: 'Why LLM as an explainer rather than a disease classifier?',
    description: 'General-purpose vision LLMs suffer from hallucination and lack fine-grained calibration on microscopic leaf lesions. CropLens keeps disease classification strictly in the specialized PyTorch CNN, using Gemini exclusively as an agronomic translator and action-plan generator.',
  },
  {
    topic: 'Environmental Context (Open-Meteo)',
    badge: 'External Weather API',
    summary: 'Live meteorological observations (Non-ML)',
    description: 'Fungal spores (such as Alternaria or Phytophthora) require free moisture and high relative humidity (>75%) to germinate. Live Open-Meteo API data provides environmental context to help farmers time spray applications before rain wash-off or during optimal calm wind hours.',
  },
];
