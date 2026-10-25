/**
 * CropLens AI Assistant Service
 * Provides LLM-driven explanations grounded strictly in existing CropHealthReport data.
 * Configured model: gemini-3.8-flash
 */

// Centralized Gemini Model ID
export const GEMINI_MODEL = 'gemini-3.8-flash';
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

/**
 * Deterministic fallback generator grounded strictly in actual ML report metrics.
 * Used when Gemini API key is unconfigured, rate-limited, or unavailable.
 */
export function generateDeterministicFallback(reportData, weatherState, reasonMessage = '') {
  const {
    crop = 'Target Crop',
    predicted_crop = crop,
    disease = 'Unknown Condition',
    disease_confidence = 0,
    severity = {},
    yield: yieldData = {},
    overall_risk = 'Low',
    risk_explanation = [],
    warnings = [],
  } = reportData || {};

  const displayCrop = predicted_crop || crop;
  const isLowConfidence = disease_confidence < 70;
  const isSeverityAvailable = severity && severity.available;

  const summary = `Basic Diagnostic Explanation for ${displayCrop}: Identified ${disease} (${disease_confidence.toFixed(
    1
  )}% confidence) with an overall ${overall_risk} risk assessment.`;

  let whatItMeans = `The plant pathology model analyzed visual leaf characteristics and detected ${disease} in ${displayCrop} with ${disease_confidence.toFixed(
    1
  )}% confidence. `;

  if (yieldData.predicted_yield != null) {
    whatItMeans += `The soil & climate feature model estimates crop yield at ${yieldData.predicted_yield} t/ha (${yieldData.yield_risk || 'Low'} yield risk). `;
  }

  const sevStatus = reportData?.severity_status || (severity?.available ? 'graded' : 'unavailable');
  const sevVal = reportData?.severity || severity?.severity;
  const sevExpl = reportData?.severity_explanation || severity?.reason;
  const isHealthy = disease.toLowerCase() === 'healthy' || sevStatus === 'healthy';

  if (isHealthy) {
    whatItMeans += `Crop leaf condition was diagnosed as healthy; disease severity grading is not required. `;
  } else if (sevStatus === 'graded' && sevVal) {
    whatItMeans += `Disease severity was assessed as ${sevVal}${reportData?.severity_confidence ? ` (${reportData.severity_confidence.toFixed(1)}% model confidence)` : ''} using the disease-conditioned severity model. `;
  } else if (sevStatus === 'not_explicitly_graded') {
    whatItMeans += `Disease severity is classified as General / Single-stage because the training data does not provide Mild/Severe grading for this disease. `;
  } else {
    whatItMeans += `Disease severity assessment is unavailable for this crop and disease combination. `;
  }

  if (weatherState?.status === 'success' && weatherState?.data) {
    whatItMeans += `Current weather in ${weatherState.data.locationName} (${weatherState.data.temperature}°C, ${weatherState.data.humidity}% humidity) provides environmental context.`;
  }

  const whatToMonitor = [
    `Inspect ${displayCrop} leaves daily for advancing lesions, spots, or foliage wilting.`,
    `Monitor ambient humidity and field plot drainage to minimize disease-favoring moisture.`,
    `Check soil moisture and temperature parameters against target crop guidelines.`,
  ];

  const nextSteps = [
    `Sanitize pruning tools and footwear between field sections to prevent spore dispersal.`,
    `Consult a certified local agronomist or extension specialist prior to chemical applications.`,
    `Maintain optimal soil nutrient ratios (NPK) according to agricultural extension guidelines.`,
  ];

  let warning = null;
  if (isLowConfidence) {
    warning = `Diagnostic Advisory: Disease confidence is ${disease_confidence.toFixed(
      1
    )}% (below 70%). This prediction is uncertain and should be verified by a plant-disease specialist before treatment.`;
  } else if (warnings && warnings.length > 0) {
    warning = warnings.join(' ');
  }

  return {
    isFallback: true,
    fallbackLabel: 'Basic AI Explanation',
    fallbackReason: reasonMessage || 'Gemini service unavailable',
    fallbackBanner: 'Gemini is temporarily unavailable. Showing a grounded basic explanation from the ML result.',
    summary,
    what_it_means: whatItMeans,
    what_to_monitor: whatToMonitor,
    next_steps: nextSteps,
    warning,
  };
}

/**
 * Validates the JSON object structure returned by the LLM.
 */
function validateAIResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (typeof parsed.summary !== 'string') return false;
  if (typeof parsed.what_it_means !== 'string') return false;
  if (!Array.isArray(parsed.what_to_monitor) && typeof parsed.what_to_monitor !== 'string') return false;
  if (!Array.isArray(parsed.next_steps) && typeof parsed.next_steps !== 'string') return false;
  return true;
}

/**
 * Generates an AI-driven explanation for a CropHealthReport using Gemini API.
 * @param {object} reportData - The ML backend report data
 * @param {object} weatherState - The Open-Meteo weather state object
 * @param {string|null} customApiKey - Optional BYOK custom API key
 * @returns {Promise<object>} - Structured explanation object
 */
export async function generateAIExplanation(reportData, weatherState, customApiKey = null) {
  // If crop mismatch was detected, do not invoke AI model
  if (!reportData || reportData.crop_mismatch) {
    return null;
  }

  // NOTE: VITE_* environment variables are bundled directly into client-side JS during build.
  // For production deployment, secret keys should be proxied through a secure backend server.
  const apiKey =
    (customApiKey && customApiKey.trim()) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY);

  if (!apiKey || !apiKey.trim() || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return generateDeterministicFallback(
      reportData,
      weatherState,
      'No Gemini API key supplied'
    );
  }

  const {
    crop = 'Crop',
    predicted_crop = crop,
    disease = 'Unknown',
    disease_confidence = 0,
    severity = {},
    yield: yieldData = {},
    overall_risk = 'Low',
    risk_explanation = [],
    warnings = [],
  } = reportData;

  const displayCrop = predicted_crop || crop;

  const weatherContext =
    weatherState?.status === 'success' && weatherState?.data
      ? `Location: ${weatherState.data.locationName}, Temp: ${weatherState.data.temperature}°C, Humidity: ${weatherState.data.humidity}%, Precip: ${weatherState.data.precipitation}mm, Wind: ${weatherState.data.windSpeed}km/h`
      : 'Weather data unavailable';

  const systemInstructions = `
You are CropLens AI, an agricultural explanation assistant.
You do NOT diagnose plants independently and you do NOT change ML predictions.
Explain the supplied CropLens ML result in simple language for a farmer.
Use ONLY the supplied ML result and environmental context.
Never invent disease names, severity values, yield values, weather values, pesticide names, chemical names, dosages, or treatment claims.
If a value is unavailable, say it is unavailable.
If disease confidence is below 70%, clearly communicate that the result should be confirmed by an agronomist or plant-disease specialist.
Distinguish between:
1. ML prediction
2. contextual weather information
3. general monitoring/recommendation
Do not claim that the yield prediction is crop-specific because the current yield model uses temperature, N, P, K and fertilizer features.
Do not override the ML prediction.
Give practical, cautious next steps that are consistent with the supplied result.

Return strictly valid JSON matching this schema:
{
  "summary": "Dynamic executive summary explaining the specific crop, disease, confidence, and yield result.",
  "what_it_means": "Detailed explanation of what the ML findings mean for the farm.",
  "what_to_monitor": ["Specific symptom or environmental factor item 1", "Item 2"],
  "next_steps": ["Actionable non-chemical farm management tip 1", "Tip 2"],
  "warning": "Prominent warning if confidence < 70% or cautionary note (or null if none)."
}`;

  const userPrompt = `
Report Data to Explain:
- Crop Species: ${displayCrop}
- Identified Disease: ${disease}
- Disease Model Confidence: ${disease_confidence.toFixed(2)}%
- Disease Severity: ${reportData.severity || severity.severity || 'Unavailable'}
- Severity Status: ${reportData.severity_status || (severity.available ? 'graded' : 'unavailable')}
- Severity Model Supported: ${reportData.severity_model_supported ? 'Yes (Multi-crop Disease-Conditioned Model)' : 'No'}
- Severity Confidence: ${reportData.severity_confidence ? `${reportData.severity_confidence.toFixed(2)}%` : 'N/A'}
- Severity Explanation: ${reportData.severity_explanation || severity.reason || 'None'}
- Yield Prediction: ${JSON.stringify(yieldData)}
- Yield Model Type: Random Forest trained on temperature, N, P, K and fertilizer features
- Overall Risk: ${overall_risk}
- Risk Synthesis Explanations: ${JSON.stringify(risk_explanation)}
- System Warnings: ${JSON.stringify(warnings)}
- Environmental Context (Weather): ${weatherContext}

Return JSON strictly.`;

  let lastErrorStatus = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstructions}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        lastErrorStatus = `HTTP ${response.status} (${modelName})`;
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) continue;

      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (!validateAIResponse(parsed)) continue;

      // Normalize array outputs
      const monitorList = Array.isArray(parsed.what_to_monitor)
        ? parsed.what_to_monitor
        : [parsed.what_to_monitor];

      const stepsList = Array.isArray(parsed.next_steps)
        ? parsed.next_steps
        : [parsed.next_steps];

      // Enforce low confidence advisory if confidence < 70%
      if (disease_confidence < 70 && (!parsed.warning || !parsed.warning.includes('70%'))) {
        parsed.warning = `Diagnostic Advisory: Disease confidence is ${disease_confidence.toFixed(
          1
        )}% (below 70%). This result is uncertain and should be verified by a plant pathologist or local agronomist.`;
      }

      return {
        isFallback: false,
        summary: parsed.summary,
        what_it_means: parsed.what_it_means,
        what_to_monitor: monitorList,
        next_steps: stepsList,
        warning: parsed.warning || null,
        usedModel: modelName,
        usedCustomKey: Boolean(customApiKey),
      };
    } catch (_) {
      // Continue to next model candidate
    }
  }

  return generateDeterministicFallback(
    reportData,
    weatherState,
    lastErrorStatus || 'Gemini API unreachable'
  );
}
