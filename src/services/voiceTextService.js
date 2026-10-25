/**
 * CropLens AI — Voice Text Preprocessor & Speech Normalization Service
 * 
 * Preprocesses AI explanations and ML diagnostic metrics into natural,
 * phonetically clear English speech scripts specifically for window.speechSynthesis.
 * 
 * IMPORTANT:
 * - This transformed text is used ONLY for audio speech synthesis.
 * - The visual UI text shown on screen remains completely untouched.
 */

// ============================================================================
// 1. PRONUNCIATION DICTIONARY & TERM NORMALIZATION
// ============================================================================

/**
 * Reusable pronunciation map for abbreviations, chemical elements, and technical names.
 */
const PRONUNCIATION_MAP = [
  // Multi-element & NPK
  { regex: /\bNPK\b/gi, replacement: 'nitrogen, phosphorus, and potassium' },
  { regex: /\bN-P-K\b/gi, replacement: 'nitrogen, phosphorus, and potassium' },

  // Soil Chemical Nutrients (carefully bounded so words like "Next", "Plan", "In" are not replaced)
  { regex: /\bNitrogen\s*\([Nn]\)/gi, replacement: 'nitrogen' },
  { regex: /\bPhosphorus\s*\([Pp]\)/gi, replacement: 'phosphorus' },
  { regex: /\bPotassium\s*\([Kk]\)/gi, replacement: 'potassium' },
  { regex: /\bN\s*:\s*/g, replacement: 'nitrogen: ' },
  { regex: /\bP\s*:\s*/g, replacement: 'phosphorus: ' },
  { regex: /\bK\s*:\s*/g, replacement: 'potassium: ' },
  { regex: /(?<=\b(?:soil|ratio|status|values?|levels?)\s+)[Nn]\b/gi, replacement: 'nitrogen' },
  { regex: /(?<=\b(?:soil|ratio|status|values?|levels?)\s+)[Pp]\b/gi, replacement: 'phosphorus' },
  { regex: /(?<=\b(?:soil|ratio|status|values?|levels?)\s+)[Kk]\b/gi, replacement: 'potassium' },
  { regex: /\bN,\s*P,\s*(?:and\s*)?K\b/gi, replacement: 'nitrogen, phosphorus, and potassium' },

  // Technical Acronyms & Models
  { regex: /\bMobileNetV2\b/gi, replacement: 'Mobile Net V two' },
  { regex: /\bMobileNet-V2\b/gi, replacement: 'Mobile Net V two' },
  { regex: /\bMobileNet\s*v2\b/gi, replacement: 'Mobile Net V two' },
  { regex: /\bOpen-Meteo\b/gi, replacement: 'Open Meteo' },
  { regex: /\bRandom Forest\b/gi, replacement: 'Random Forest' },
  { regex: /\bRF\b/g, replacement: 'random forest' },
  { regex: /\bCNN\b/g, replacement: 'C N N' },
  { regex: /\bML\b/g, replacement: 'machine learning' },
  { regex: /\bAI\b/g, replacement: 'A I' },
  { regex: /\bAPI\b/g, replacement: 'A P I' },
  { regex: /\bAPIs\b/g, replacement: 'A P I s' },
  { regex: /\bLLM\b/g, replacement: 'large language model' },
  { regex: /\bPyTorch\b/gi, replacement: 'Pie Torch' },
  { regex: /\bFastAPI\b/gi, replacement: 'Fast A P I' },
  { regex: /\bIDP\b/g, replacement: 'I D P' },
  { regex: /\bRGB\b/g, replacement: 'R G B' },
  { regex: /\bGrad-CAM\b/gi, replacement: 'Grad Cam' },

  // Academic Metrics
  { regex: /\bMacro-F1\b/gi, replacement: 'macro F one' },
  { regex: /\bMacro\s*F1\b/gi, replacement: 'macro F one' },
  { regex: /\bF1\b/g, replacement: 'F one' },
  { regex: /R²|R\^2|\bR2\b/g, replacement: 'R squared' },
  { regex: /\bMAE\b/g, replacement: 'mean absolute error' },
  { regex: /\bRMSE\b/g, replacement: 'root mean square error' },

  // Units of Measurement
  { regex: /(\d+(?:\.\d+)?)\s*t\/ha\b/gi, replacement: '$1 tonnes per hectare' },
  { regex: /\bt\/ha\b/gi, replacement: 'tonnes per hectare' },
  { regex: /(\d+(?:\.\d+)?)\s*kg\/ha\b/gi, replacement: '$1 kilograms per hectare' },
  { regex: /\bkg\/ha\b/gi, replacement: 'kilograms per hectare' },
  { regex: /(\d+(?:\.\d+)?)\s*°C\b/g, replacement: '$1 degrees Celsius' },
  { regex: /(\d+(?:\.\d+)?)\s*deg\s*C\b/gi, replacement: '$1 degrees Celsius' },
  { regex: /(\d+(?:\.\d+)?)\s*km\/h\b/gi, replacement: '$1 kilometers per hour' },
  { regex: /\bkm\/h\b/gi, replacement: 'kilometers per hour' },
  { regex: /(\d+(?:\.\d+)?)\s*m\/s\b/gi, replacement: '$1 meters per second' },
  { regex: /\bm\/s\b/gi, replacement: 'meters per second' },
  { regex: /(\d+(?:\.\d+)?)\s*mm\b/gi, replacement: '$1 millimeters' },
  { regex: /(\d+(?:\.\d+)?)\s*cm\b/gi, replacement: '$1 centimeters' },
  { regex: /(\d+(?:\.\d+)?)\s*%/g, replacement: '$1 percent' },
  { regex: /%/g, replacement: ' percent' },

  // Agricultural Phrases & Diagnostics
  { regex: /\bGeneral\s*\/\s*Single-stage\b/gi, replacement: 'single-stage disease classification' },
  { regex: /\bGeneral\s+Single-stage\b/gi, replacement: 'single-stage disease classification' },
  { regex: /\bSingle-stage\b/gi, replacement: 'single-stage' },
  { regex: /\b(not_explicitly_graded|not explicitly graded)\b/gi, replacement: 'severity was not explicitly graded in the training data' },
  { regex: /\bSeverity unavailable\b/gi, replacement: 'severity assessment is not available for this crop and disease' },
  { regex: /\bYield\s*risk\s*:\s*Medium\b/gi, replacement: 'the yield risk is medium' },
  { regex: /\bYield\s*risk\s*:\s*High\b/gi, replacement: 'the yield risk is high' },
  { regex: /\bYield\s*risk\s*:\s*Low\b/gi, replacement: 'the yield risk is low' },
  { regex: /\bDiagnostic\s*Advisory\s*:\s*/gi, replacement: 'Diagnostic advisory: ' },
  { regex: /\bBasic\s*Diagnostic\s*Explanation\s*for\s*/gi, replacement: 'Diagnosis for ' },
];

/**
 * Normalizes text for speech by applying dictionary substitutions and stripping raw markdown.
 * 
 * @param {string} text Raw text string
 * @returns {string} Phonetically normalized string for speech
 */
export function normalizePronunciation(text) {
  if (!text || typeof text !== 'string') return '';

  let normalized = text;

  // 1. Clean markdown formatting
  normalized = normalized
    .replace(/^#+\s+/gm, '') // Remove heading hashes
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italics
    .replace(/__(.*?)__/g, '$1') // Remove underline
    .replace(/`([^`]+)`/g, '$1') // Remove code backticks
    .replace(/^\s*[-*•]\s+/gm, '') // Remove bullet characters
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text

  // 2. Remove unwanted UI markers / debug keywords
  normalized = normalized
    .replace(/^SUMMARY\.\s*/gi, '')
    .replace(/^SUMMARY\s*:\s*/gi, '')
    .replace(/\(Controlled validation\)/gi, '')
    .replace(/\(Laboratory background\)/gi, '');

  // 3. Apply pronunciation replacements
  for (const { regex, replacement } of PRONUNCIATION_MAP) {
    normalized = normalized.replace(regex, replacement);
  }

  // 4. Clean extra spaces and punctuation artifacts
  normalized = normalized
    .replace(/\s+/g, ' ')
    .replace(/\s+([,!?;:])/g, '$1')
    .replace(/([.,!?;:])\1+/g, '$1')
    .trim();

  return normalized;
}

// ============================================================================
// 2. DYNAMIC FARMER SPEECH SCRIPT BUILDER
// ============================================================================

/**
 * Builds a natural, farmer-friendly spoken script from the current ML report data
 * and AI explanation.
 * 
 * Order of sections:
 * 1. Summary: Crop, disease, confidence, severity status, estimated yield & risk.
 * 2. What this means: Agronomic diagnostic interpretation.
 * 3. What to monitor: Specific field symptoms to check.
 * 4. Next steps: Concrete agronomic actions and precautions.
 * 
 * @param {Object} explanation AI explanation object (Gemini or deterministic fallback)
 * @param {Object} reportData Full ML diagnostic result from backend
 * @param {Object} weatherState Live environmental weather context
 * @returns {string} Natural, fully-normalized spoken script
 */
export function buildFarmerSpeechScript(explanation, reportData, weatherState) {
  if (!reportData) return '';

  const {
    crop = '',
    predicted_crop = crop,
    disease = '',
    disease_confidence = null,
    severity = {},
    yield: yieldData = {},
    warnings = [],
  } = reportData;

  const displayCrop = (predicted_crop || crop || 'Crop').trim();
  const displayDisease = (disease || 'Normal Condition').trim();
  const isHealthy = displayDisease.toLowerCase() === 'healthy';

  const scriptSections = [];

  // --------------------------------------------------------------------------
  // SECTION 1: NATURAL SPOKEN SUMMARY (Clear Lead-in)
  // --------------------------------------------------------------------------
  let summarySentence = '';
  const confidenceStr =
    disease_confidence != null ? `${disease_confidence.toFixed(1)} percent` : '';

  if (isHealthy) {
    summarySentence = `The uploaded leaf was identified as healthy ${displayCrop}`;
    if (confidenceStr) {
      summarySentence += `, with ${confidenceStr} model confidence.`;
    } else {
      summarySentence += `.`;
    }
  } else {
    summarySentence = `The uploaded leaf was identified as ${displayCrop} with ${displayDisease}`;
    if (confidenceStr) {
      summarySentence += `, with ${confidenceStr} model confidence.`;
    } else {
      summarySentence += `.`;
    }
  }

  // Severity Staging
  const sevStatus =
    reportData?.severity_status || (severity?.available ? 'graded' : 'unavailable');
  const sevVal = reportData?.severity || severity?.severity;
  const isSingleStage =
    sevStatus === 'not_explicitly_graded' ||
    (typeof sevVal === 'string' &&
      (sevVal.toLowerCase().includes('single-stage') ||
        sevVal.toLowerCase().includes('general') ||
        sevVal.toLowerCase().includes('not explicitly')));

  let severitySentence = '';
  if (isHealthy) {
    severitySentence = `Disease severity grading is not required for healthy foliage.`;
  } else if (isSingleStage) {
    severitySentence = `The current severity model does not provide a Mild or Severe grade for this disease.`;
  } else if (sevStatus === 'graded' && sevVal) {
    severitySentence = `The disease-conditioned severity model assessed the infection as ${sevVal}.`;
  } else {
    severitySentence = `Severity assessment is not available for this crop and disease.`;
  }

  // Yield & Risk
  let yieldSentence = '';
  if (yieldData?.predicted_yield != null) {
    const yieldRisk = (yieldData.yield_risk || 'medium').toLowerCase();
    yieldSentence = `The estimated yield is ${yieldData.predicted_yield} tonnes per hectare, with a ${yieldRisk} yield risk.`;
  }

  // Weather Context
  let weatherSentence = '';
  if (weatherState?.status === 'success' && weatherState?.data) {
    const { locationName, temperature, humidity } = weatherState.data;
    if (temperature != null && humidity != null) {
      weatherSentence = `Current weather near ${locationName || 'the farm'} is ${temperature} degrees Celsius with ${humidity} percent humidity.`;
    }
  }

  scriptSections.push(
    [summarySentence, severitySentence, yieldSentence, weatherSentence]
      .filter(Boolean)
      .join(' ')
  );

  // --------------------------------------------------------------------------
  // SECTION 2: WHAT THIS MEANS
  // --------------------------------------------------------------------------
  if (explanation?.what_it_means) {
    const cleanMeans = explanation.what_it_means
      .replace(/^what this means\s*:\s*/gi, '')
      .trim();
    if (cleanMeans) {
      scriptSections.push(`What this means: ${cleanMeans}`);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 3: WHAT TO MONITOR
  // --------------------------------------------------------------------------
  let monitorText = '';
  if (explanation?.what_to_monitor) {
    if (Array.isArray(explanation.what_to_monitor) && explanation.what_to_monitor.length > 0) {
      monitorText = explanation.what_to_monitor.join('. ');
    } else if (typeof explanation.what_to_monitor === 'string') {
      monitorText = explanation.what_to_monitor;
    }
  }

  if (monitorText) {
    const cleanMon = monitorText.replace(/^what (?:you should|to) monitor\s*:\s*/gi, '').trim();
    scriptSections.push(`What you should monitor: ${cleanMon}`);
  } else if (!isHealthy) {
    scriptSections.push(
      `What you should monitor: inspect the leaves regularly for worsening lesions, spots, or foliage wilting.`
    );
  }

  // --------------------------------------------------------------------------
  // SECTION 4: RECOMMENDED NEXT STEPS & SAFETY
  // --------------------------------------------------------------------------
  let nextStepsText = '';
  if (explanation?.next_steps) {
    if (Array.isArray(explanation.next_steps) && explanation.next_steps.length > 0) {
      nextStepsText = explanation.next_steps.join('. ');
    } else if (typeof explanation.next_steps === 'string') {
      nextStepsText = explanation.next_steps;
    }
  }

  if (nextStepsText) {
    const cleanSteps = nextStepsText.replace(/^(?:recommended\s*)?next steps\s*:\s*/gi, '').trim();
    scriptSections.push(`Recommended next steps: ${cleanSteps}`);
  } else {
    scriptSections.push(
      `Recommended next steps: monitor the crop regularly and consult a local agronomist before applying chemical treatments.`
    );
  }

  // Diagnostic Advisory Warning (if present)
  if (explanation?.warning) {
    const cleanWarn = explanation.warning
      .replace(/^diagnostic advisory\s*:\s*/gi, '')
      .trim();
    if (cleanWarn) {
      scriptSections.push(`Diagnostic advisory: ${cleanWarn}`);
    }
  }

  // Combine and normalize entire script
  const rawJoined = scriptSections.join(' ');
  return normalizePronunciation(rawJoined);
}

// ============================================================================
// 3. SENTENCE-BASED SPEECH CHUNKING
// ============================================================================

/**
 * Splits a speech script into intelligent, sentence-bounded chunks to avoid
 * SpeechSynthesis engine timeouts on long text without breaking numbers or phrases.
 * 
 * Never splits inside decimal numbers (e.g. 65.5, 10.99, 32.3).
 * 
 * @param {string} fullText Fully-normalized speech script
 * @param {number} maxChunkLength Maximum desired character length per chunk (default: 200)
 * @returns {string[]} Array of speakable sentence chunks
 */
export function splitIntoSpeechChunks(fullText, maxChunkLength = 200) {
  if (!fullText || typeof fullText !== 'string') return [];

  // Match sentences ending in '.', '!', '?', or ';' followed by a space and capital letter or digit
  // This explicitly avoids splitting decimal numbers like 65.5 or 10.99
  const rawSentences = fullText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    if (!sentence) continue;

    if (currentChunk.length + sentence.length + 1 <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single sentence is exceptionally long, split by comma or clause
      if (sentence.length > maxChunkLength) {
        const clauses = sentence.split(/,\s+/);
        let subChunk = '';
        for (const clause of clauses) {
          if (subChunk.length + clause.length + 1 <= maxChunkLength) {
            subChunk = subChunk ? `${subChunk}, ${clause}` : clause;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = clause;
          }
        }
        currentChunk = subChunk;
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// ============================================================================
// 4. VOICE SELECTION STRATEGY
// ============================================================================

/**
 * Retrieves all available English voices from window.speechSynthesis.
 * 
 * @returns {SpeechSynthesisVoice[]} Filtered list of English voices
 */
export function getAvailableEnglishVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices() || [];
  return voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith('en')
  );
}

/**
 * Selects the best English voice based on user preference or prioritized fallback:
 * 1. User-selected voice (by voiceURI)
 * 2. en-IN (English India)
 * 3. en-US (English United States)
 * 4. Any English voice
 * 5. Default browser voice
 * 
 * @param {SpeechSynthesisVoice[]} voices List of available voices
 * @param {string} preferredVoiceURI Optional voiceURI chosen by user
 * @returns {SpeechSynthesisVoice|null} Selected voice
 */
export function selectBestVoice(voices, preferredVoiceURI = '') {
  if (!voices || voices.length === 0) return null;

  // 1. User manual selection match
  if (preferredVoiceURI && preferredVoiceURI !== 'auto') {
    const userVoice = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (userVoice) return userVoice;
  }

  // 2. English (India) preference
  const inVoice = voices.find(
    (v) =>
      v.lang &&
      (v.lang.toLowerCase() === 'en-in' ||
        v.lang.toLowerCase() === 'en_in' ||
        v.name.toLowerCase().includes('india'))
  );
  if (inVoice) return inVoice;

  // 3. English (United States) preference
  const usVoice = voices.find(
    (v) =>
      v.lang &&
      (v.lang.toLowerCase() === 'en-us' ||
        v.lang.toLowerCase() === 'en_us' ||
        v.name.toLowerCase().includes('united states') ||
        v.name.toLowerCase().includes('us english'))
  );
  if (usVoice) return usVoice;

  // 4. Any English voice
  const anyEnglish = voices.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith('en')
  );
  if (anyEnglish) return anyEnglish;

  // 5. Fallback to first voice
  return voices[0] || null;
}
