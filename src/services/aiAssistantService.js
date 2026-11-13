/**
 * CropLens AI Assistant Service
 * Calls the FastAPI backend POST /explain/crop-health endpoint for grounded,
 * disease-specific agricultural explanations powered by Gemini + knowledge_base.py.
 *
 * Security: The Gemini API key is NEVER sent from the browser.
 * The backend reads GEMINI_API_KEY from its own server environment.
 *
 * When a user provides a custom BYOK key via the UI, it is sent as the
 * X-Gemini-API-Key header — the backend uses it for that single request only.
 */

import { API_BASE_URL } from '../config/api';

/**
 * Validates the structured response from the backend explanation endpoint.
 * @param {object} parsed Response JSON
 * @returns {boolean}
 */
function validateExplanationResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (typeof parsed.summary !== 'string' || !parsed.summary) return false;
  if (typeof parsed.what_it_means !== 'string') return false;
  if (!Array.isArray(parsed.what_to_monitor) && typeof parsed.what_to_monitor !== 'string') return false;
  if (!Array.isArray(parsed.next_steps) && typeof parsed.next_steps !== 'string') return false;
  return true;
}

/**
 * Builds a minimal client-side fallback when the backend is completely unreachable.
 * This is NOT the same as the backend's grounded knowledge-base fallback.
 * This only fires when the network request itself fails (e.g. CORS, backend down).
 */
function generateClientFallback(reportData, reasonMessage = '') {
  const {
    crop = 'Target Crop',
    predicted_crop = crop,
    disease = 'Unknown Condition',
    disease_confidence = 0,
    overall_risk = 'Low',
    warnings = [],
  } = reportData || {};

  const displayCrop = predicted_crop || crop;

  return {
    isFallback: true,
    is_fallback: true,
    fallbackReason: reasonMessage || 'ML service backend unreachable',
    usedModel: 'Client-side Emergency Fallback',
    summary: `Diagnostic Summary for ${displayCrop}: Identified ${disease} (${disease_confidence.toFixed(1)}% confidence) with an overall ${overall_risk} risk assessment.`,
    what_it_means: `The ML pipeline identified ${disease} in ${displayCrop} with ${disease_confidence.toFixed(1)}% confidence. Detailed disease-specific explanation is currently unavailable because the backend explanation service could not be reached.`,
    what_to_monitor: [
      `Inspect ${displayCrop} leaves daily for advancing lesions, spots, or foliage wilting.`,
      `Monitor ambient humidity and field drainage to minimize disease-favoring moisture.`,
      `Check soil moisture and temperature parameters against target crop guidelines.`,
    ],
    next_steps: [
      `Sanitize pruning tools and footwear between field sections to prevent spore dispersal.`,
      `Consult a certified local agronomist or extension specialist prior to chemical applications.`,
      `Maintain optimal soil nutrient ratios (NPK) according to agricultural extension guidelines.`,
    ],
    warning: disease_confidence < 70
      ? `Diagnostic Advisory: Disease confidence is ${disease_confidence.toFixed(1)}% (below 70%). This prediction is uncertain and should be verified by a plant-disease specialist before treatment.`
      : (warnings && warnings.length > 0 ? warnings.join(' ') : null),
    explanation_sections: null,
    sources: null,
  };
}

/**
 * Generates an AI-driven explanation for a CropHealthReport by calling the
 * FastAPI POST /explain/crop-health backend endpoint.
 *
 * @param {object} reportData - The ML backend report data (from /predict/crop-health)
 * @param {object} weatherState - The Open-Meteo weather state object
 * @param {string|null} customApiKey - Optional BYOK custom API key (sent as header, never logged)
 * @returns {Promise<object>} - Structured explanation object
 */
export async function generateAIExplanation(reportData, weatherState, customApiKey = null) {
  // If crop mismatch was detected, do not invoke the explanation service
  if (!reportData || reportData.crop_mismatch) {
    return null;
  }

  // Build the structured payload from the actual ML prediction result
  const {
    crop = 'Unknown',
    predicted_crop = crop,
    disease = 'Unknown',
    raw_class = null,
    disease_confidence = 0,
    severity,
    severity_confidence,
    severity_status,
    severity_model_supported,
    severity_explanation,
    yield: yieldData = {},
    predicted_yield,
    yield_risk,
    overall_risk = 'Low',
    risk_explanation = [],
    warnings = [],
  } = reportData;

  // Build weather context for the backend
  let weather_context = null;
  if (weatherState?.status === 'success' && weatherState?.data) {
    weather_context = {
      temperature: weatherState.data.temperature,
      humidity: weatherState.data.humidity,
      precipitation: weatherState.data.precipitation,
      windSpeed: weatherState.data.windSpeed,
      location_name: weatherState.data.locationName,
      condition: weatherState.data.condition || null,
    };
  }

  // Build farm context from yield features if available
  let farm_context = null;
  if (reportData.farm_context) {
    farm_context = reportData.farm_context;
  }

  const payload = {
    crop: predicted_crop || crop,
    predicted_crop: predicted_crop || crop,
    disease,
    raw_class: raw_class || null,
    confidence: disease_confidence,
    disease_confidence,
    severity: severity?.severity || severity || null,
    severity_confidence: severity_confidence || severity?.confidence || null,
    severity_status: severity_status || (severity?.available ? 'graded' : 'unavailable'),
    severity_model_supported: severity_model_supported || false,
    severity_explanation: severity_explanation || severity?.reason || null,
    predicted_yield: predicted_yield ?? yieldData?.predicted_yield ?? null,
    yield_risk: yield_risk || yieldData?.yield_risk || 'Low',
    overall_risk,
    risk_explanation,
    warnings,
    farm_context,
    weather_context,
    weather_state: weatherState || null,
  };

  // Build headers — pass custom key via header, never in the URL
  const headers = {
    'Content-Type': 'application/json',
  };
  if (customApiKey && typeof customApiKey === 'string' && customApiKey.trim()) {
    headers['X-Gemini-API-Key'] = customApiKey.trim();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/explain/crop-health`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = `Backend returned HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) errorDetail = errJson.detail;
      } catch (_) {}
      console.warn('[AI Assistant] Backend error:', errorDetail);
      return generateClientFallback(reportData, errorDetail);
    }

    const data = await response.json();

    // Validate the backend response structure
    if (!validateExplanationResponse(data)) {
      console.warn('[AI Assistant] Invalid response structure from backend');
      return generateClientFallback(reportData, 'Invalid response from explanation service');
    }

    // Normalize array outputs (defensive)
    if (typeof data.what_to_monitor === 'string') {
      data.what_to_monitor = [data.what_to_monitor];
    }
    if (typeof data.next_steps === 'string') {
      data.next_steps = [data.next_steps];
    }

    // Normalize the isFallback flag for consistent frontend consumption
    data.isFallback = data.isFallback ?? data.is_fallback ?? false;
    data.is_fallback = data.isFallback;

    // Normalize model name for display
    data.usedModel = data.usedModel || data.used_model || null;
    data.usedCustomKey = data.used_custom_key ?? Boolean(customApiKey && customApiKey.trim());

    return data;
  } catch (err) {
    console.warn('[AI Assistant] Network error calling explanation endpoint:', err.message);
    return generateClientFallback(
      reportData,
      `Could not connect to ML service at ${API_BASE_URL}: ${err.message}`
    );
  }
}
