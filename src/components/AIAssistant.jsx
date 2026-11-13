import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout,
  Sun,
  Gauge,
  BarChart2,
  ShieldCheck,
  Shield,
  Eye,
  Droplets,
  Leaf,
  Wind,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Volume2,
  Square,
  Key,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Thermometer,
} from 'lucide-react';
import { generateAIExplanation } from '../services/aiAssistantService';
import {
  buildFarmerSpeechScript,
  splitIntoSpeechChunks,
  getAvailableEnglishVoices,
  selectBestVoice,
} from '../services/voiceTextService';
import './CropHealthReportEnhanced.css';

/* ─── Animation constant ─── */
const EASE = [0.16, 1, 0.3, 1];

const cardFadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE },
});

/* ─── Helper: Format & Highlight Diagnostic Summary ─── */
function renderHighlightedSummary(summaryText, data) {
  const {
    crop = 'Crop',
    disease = 'Condition',
    pathogenName = '',
    confidence = 0,
    severity = '',
    predictedYield = null,
    yieldRisk = 'Low',
    isHealthy = false,
  } = data;

  const confStr = typeof confidence === 'number' ? `${confidence.toFixed(1)}% confidence` : `${confidence}% confidence`;
  const yieldStr = predictedYield != null ? `${predictedYield} t/ha` : null;
  const riskClass = (yieldRisk || '').toLowerCase() === 'high'
    ? 'risk-high'
    : (yieldRisk || '').toLowerCase() === 'medium'
      ? 'risk-medium'
      : 'risk-low';

  if (isHealthy) {
    return (
      <p className="report-summary-text">
        CropLens AI has diagnosed your <strong className="report-highlight-green">{crop}</strong> crop as{' '}
        <strong className="report-highlight-green">Healthy</strong> with{' '}
        <strong className="report-highlight-green">{confStr}</strong>. Active foliar photosynthesis confirmed with{' '}
        <strong className="report-highlight-green">0% disease progression</strong>, and an expected yield of{' '}
        <strong className="report-highlight-green">{yieldStr || 'optimal yield'}</strong> indicating a{' '}
        <span className={`report-highlight-risk ${riskClass}`}>{yieldRisk} Yield Risk</span>.
      </p>
    );
  }

  return (
    <p className="report-summary-text">
      CropLens AI has diagnosed your <strong className="report-highlight-green">{crop}</strong> crop with{' '}
      <strong className="report-highlight-green">{disease}</strong>
      {pathogenName ? (
        <>
          {' '}caused by the pathogen <em className="report-pathogen-name">{pathogenName}</em>
        </>
      ) : null}{' '}
      with <strong className="report-highlight-green">{confStr}</strong>. The current disease severity is graded as{' '}
      <strong className="report-highlight-green">{severity || 'Assessed'}</strong>
      {yieldStr ? (
        <>
          , with an expected yield of <strong className="report-highlight-green">{yieldStr}</strong>
        </>
      ) : null}{' '}
      indicating a <span className={`report-highlight-risk ${riskClass}`}>{yieldRisk} Yield Risk</span>.
    </p>
  );
}

/* ─── Timeline Animation Variants ─── */
const timelineContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      staggerChildren: 0.18,
      delayChildren: 0.25,
    },
  },
};

const timelineCardVariants = {
  hidden: { opacity: 0, x: -28, filter: 'blur(2px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: EASE,
    },
  },
};

const badgeVariants = {
  hidden: { scale: 0.4, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 22,
    },
  },
};

const iconBadgeVariants = {
  hidden: { scale: 0.4, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      delay: 0.1,
      ease: EASE,
    },
  },
};

export default function AIAssistant({ reportData, weatherState, onNavigate }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [activeCustomKey, setActiveCustomKey] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('auto');
  const [speechRate, setSpeechRate] = useState(0.95);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [showDetailedSections, setShowDetailedSections] = useState(true);

  const isCancelledRef = useRef(false);
  const activeChunkIndexRef = useRef(0);
  const chunksQueueRef = useRef([]);

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Stop active speech and reset queue
  const stopSpeech = () => {
    isCancelledRef.current = true;
    chunksQueueRef.current = [];
    activeChunkIndexRef.current = 0;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Load available English voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      setAvailableVoices(getAvailableEnglishVoices());
    };
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Cleanup on unmount or reportData change
  useEffect(() => {
    return () => stopSpeech();
  }, []);

  useEffect(() => {
    stopSpeech();
  }, [explanation]);

  // Auto-generate on load if reportData is present
  useEffect(() => {
    if (reportData && !reportData.crop_mismatch) {
      handleGenerate(activeCustomKey);
    }
  }, [reportData, weatherState]);

  const handleGenerate = async (overrideKey = activeCustomKey) => {
    if (!reportData || reportData.crop_mismatch) return;
    stopSpeech();
    setLoading(true);
    setErrorNotice(null);
    try {
      const res = await generateAIExplanation(reportData, weatherState, overrideKey);
      setExplanation(res);
    } catch (err) {
      console.error('AI Assistant component error:', err);
      setErrorNotice('Failed to generate AI explanation.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomKey = (e) => {
    e.preventDefault();
    const trimmed = customKeyInput.trim();
    setActiveCustomKey(trimmed);
    handleGenerate(trimmed);
    setShowKeyPanel(false);
  };

  const handleClearCustomKey = () => {
    setCustomKeyInput('');
    setActiveCustomKey('');
    handleGenerate('');
    setShowKeyPanel(false);
  };

  // Sequential sentence-chunked speech playback
  const speakChunksSequentially = (chunks, voice, rate) => {
    if (!chunks || chunks.length === 0 || isCancelledRef.current) {
      setIsSpeaking(false);
      return;
    }
    const chunkText = chunks[activeChunkIndexRef.current];
    if (!chunkText) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunkText);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      if (!isCancelledRef.current) setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (isCancelledRef.current) {
        setIsSpeaking(false);
        return;
      }
      const nextIdx = activeChunkIndexRef.current + 1;
      if (nextIdx < chunks.length) {
        activeChunkIndexRef.current = nextIdx;
        speakChunksSequentially(chunks, voice, rate);
      } else {
        setIsSpeaking(false);
        activeChunkIndexRef.current = 0;
      }
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', event);
      }
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeech = () => {
    if (!speechSupported) return;
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    stopSpeech();
    isCancelledRef.current = false;

    const script = buildFarmerSpeechScript(explanation, reportData, weatherState);
    if (!script) return;
    const chunks = splitIntoSpeechChunks(script, 220);
    if (!chunks || chunks.length === 0) return;

    chunksQueueRef.current = chunks;
    activeChunkIndexRef.current = 0;
    const voice = selectBestVoice(availableVoices, selectedVoiceURI);
    speakChunksSequentially(chunks, voice, speechRate);
  };

  if (!reportData || reportData.crop_mismatch) return null;

  // Extract core diagnostic fields
  const crop = reportData.predicted_crop || reportData.crop || 'Unknown';
  const disease = reportData.disease || 'Unknown';
  const diseaseConfidence = reportData.disease_confidence || 0;
  const isHealthy = disease.toLowerCase() === 'healthy' || reportData.severity_status === 'healthy';
  const severityVal = reportData.severity || (isHealthy ? 'Healthy' : (reportData.severity_status === 'not_explicitly_graded' ? 'General' : 'Assessed'));
  const severityConfidence = reportData.severity_confidence;
  const predictedYield = reportData.predicted_yield ?? reportData.yield?.predicted_yield;
  const yieldRisk = reportData.yield_risk || reportData.yield?.yield_risk || 'Low';
  const overallRisk = reportData.overall_risk || 'Low';

  // Sections & Knowledge Sources
  const sections = explanation?.explanation_sections || {};
  const sources = explanation?.sources || [];
  const hasSections = sections && typeof sections === 'object' && Object.keys(sections).length > 0;

  // Causative pathogen details
  const pathogen = sections.causative_pathogen || {};
  const sciName = pathogen.scientific_name || '';
  const pathogenType = pathogen.pathogen_type || 'Fungus';
  const taxonomy = pathogen.taxonomic_order_family || '';

  // Weather parameters
  const weatherData = weatherState?.status === 'success' ? weatherState.data : null;
  const humidityVal = weatherData?.humidity ?? 82;
  const tempVal = weatherData?.temperature ?? 27.4;

  // Environmental triggers from knowledge base
  const favorable = sections.favorable_conditions || {};
  const humidityDesc = typeof favorable === 'string'
    ? favorable
    : (favorable.humidity_moisture || 'high-moisture conditions with restricted air circulation that favor fungal sporulation');

  // "Why it develops" explanation text
  const whyItDevelopsText = typeof favorable === 'object' && favorable.key_triggers && Array.isArray(favorable.key_triggers)
    ? favorable.key_triggers.join(', ')
    : (typeof favorable === 'string'
      ? favorable
      : `The ${pathogenType.toLowerCase()} typically develops under persistent high relative humidity and restricted air circulation, producing characteristic spots on foliage.`);

  // Farm context
  const farmCtx = reportData.farm_context || {};
  const hasFarmData = Boolean(farmCtx.fertilizer || farmCtx.n || farmCtx.p || farmCtx.k);

  // Symptoms and Management lists
  const symptomsList = explanation?.what_to_monitor && explanation.what_to_monitor.length > 0
    ? explanation.what_to_monitor
    : [
      'Check for pale green to light yellow chlorotic spots on the upper leaf surface.',
      'Monitor relative humidity levels to ensure they stay below 85% to inhibit further fungal germination.',
      'Inspect older lower foliage and under-canopy where infections typically begin.',
    ];

  const managementList = explanation?.next_steps && explanation.next_steps.length > 0
    ? explanation.next_steps
    : [
      'Remove and safely dispose of infected lower leaves at first detection during warm, dry midday hours.',
      'Apply protectant fungicides or bio-fungicides adhering to product labels and regional extension guidance.',
      'Sanitize greenhouse trellises, benches, and cutting tools between crop cycles.',
    ];

  // Severity indicator position (0% - 100%)
  const severityPercent = isHealthy
    ? 0
    : severityVal.toLowerCase() === 'mild'
      ? 20
      : severityVal.toLowerCase() === 'severe'
        ? 85
        : 45;

  // Source Badge determination
  const isFallback = explanation?.isFallback || explanation?.is_fallback;
  const usedModel = explanation?.usedModel || explanation?.used_model || 'gemini-3.5-flash-lite';

  return (
    <div className="report-enhanced-container">

      {/* ═══════ AI CONTROLS BAR ═══════ */}
      <div className="report-ai-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Engine Badge */}
          <span
            className="card-badge font-mono"
            style={{
              backgroundColor: isFallback ? '#fff7ed' : '#f0fdf4',
              color: isFallback ? '#c2410c' : '#15803d',
              border: `1px solid ${isFallback ? '#fed7aa' : '#bbf7d0'}`,
              fontSize: '0.725rem',
              fontWeight: '700',
            }}
          >
            {isFallback ? 'Grounded Agricultural Knowledge Base' : `AI Engine: ${usedModel}`}
          </span>

          {/* Language Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid #e5e7eb',
              fontSize: '0.75rem',
            }}
          >
            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: '#ffffff', fontWeight: '700', color: 'var(--forest-950)' }}>
              English
            </span>
            <span
              title="Telugu translation coming soon"
              style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#9ca3af', cursor: 'not-allowed' }}
            >
              తెలుగు (Soon)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Audio Listen / Stop */}
          {speechSupported && (
            <button
              type="button"
              className="btn-tap"
              aria-label={isSpeaking ? 'Stop voice readout' : 'Listen to report'}
              disabled={loading || !explanation}
              onClick={handleToggleSpeech}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: isSpeaking ? '1px solid #fca5a5' : '1px solid #bbf7d0',
                backgroundColor: isSpeaking ? '#fee2e2' : '#f0fdf4',
                color: isSpeaking ? '#b91c1c' : '#15803d',
                cursor: loading || !explanation ? 'not-allowed' : 'pointer',
              }}
            >
              {isSpeaking ? (
                <>
                  <Square style={{ width: '13px', height: '13px', fill: '#dc2626', color: '#dc2626' }} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 style={{ width: '15px', height: '15px' }} />
                  <span>Listen</span>
                </>
              )}
            </button>
          )}

          {/* Voice Selector */}
          {speechSupported && availableVoices.length > 0 && (
            <select
              aria-label="Select voice"
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '0.3rem 0.5rem',
                backgroundColor: '#ffffff',
                color: 'var(--forest-950)',
                cursor: 'pointer',
                maxWidth: '130px',
              }}
            >
              <option value="auto">Auto Voice</option>
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name.slice(0, 16)}
                </option>
              ))}
            </select>
          )}

          {/* Speed Selector */}
          {speechSupported && (
            <select
              aria-label="Speech speed"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '0.3rem 0.5rem',
                backgroundColor: '#ffffff',
                color: 'var(--forest-950)',
                cursor: 'pointer',
              }}
            >
              <option value="0.9">0.9x</option>
              <option value="0.95">0.95x</option>
              <option value="1.0">1.0x</option>
              <option value="1.1">1.1x</option>
            </select>
          )}

          {/* Connect Key Button */}
          <button
            type="button"
            className="btn-tap"
            onClick={() => setShowKeyPanel(!showKeyPanel)}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: '1px solid rgba(11, 43, 26, 0.15)',
              backgroundColor: '#ffffff',
              color: 'var(--forest-950)',
              cursor: 'pointer',
            }}
          >
            <Key style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} />
            {activeCustomKey ? 'Key Connected' : 'API Key'}
          </button>

          {/* Regenerate Button */}
          <button
            type="button"
            className="btn-tap"
            disabled={loading}
            onClick={() => handleGenerate(activeCustomKey)}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Input Dropdown Panel */}
      {showKeyPanel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(11, 43, 26, 0.15)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--forest-950)' }}>
              Custom Gemini API Key
            </h4>
            <span style={{ fontSize: '0.725rem', color: '#6b7280' }}>
              Transmitted securely via request header only
            </span>
          </div>
          <form onSubmit={handleApplyCustomKey} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Paste Gemini API key (AIzaSy...)"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              style={{
                flex: '1',
                minWidth: '220px',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.85rem',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Apply Key
            </button>
            {activeCustomKey && (
              <button
                type="button"
                onClick={handleClearCustomKey}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </form>
        </motion.div>
      )}

      {/* Fallback Warning Banner if applicable */}
      {isFallback && explanation?.fallbackReason && (
        <div
          style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem',
            fontSize: '0.8125rem',
            color: '#9a3412',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <Info style={{ width: '18px', height: '18px', flexShrink: 0, color: '#ea580c' }} />
          <div>
            <strong>Grounded Agricultural Knowledge Base Active</strong>
            <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>
              Reason: {explanation.fallbackReason}
            </span>
          </div>
        </div>
      )}

      {/* Critical Diagnostic Advisory Banner if present */}
      {explanation?.warning && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '800', color: '#991b1b' }}>
              Diagnostic Advisory
            </h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#7f1d1d', lineHeight: '1.45' }}>
              {explanation.warning}
            </p>
          </div>
        </div>
      )}

      {/* ═══════ 1. DIAGNOSTIC SUMMARY HEADING ═══════ */}
      <div className="report-section-header">
        <h2 className="report-section-title">
          Diagnostic Summary
        </h2>
        <div className="report-title-line" />
      </div>

      {/* ═══════ 2. PROMINENT ROUNDED SUMMARY BANNER (Reference 1) ═══════ */}
      <motion.div {...cardFadeUp(0.05)} className="report-summary-panel">
        {renderHighlightedSummary(explanation?.summary, {
          crop,
          disease,
          pathogenName: sciName,
          confidence: diseaseConfidence,
          severity: severityVal,
          predictedYield,
          yieldRisk,
          isHealthy,
        })}
      </motion.div>

      {/* ═══════ 3. FIVE METRIC CARDS ROW (Reference 1) ═══════ */}
      <div className="report-metrics-row">
        {/* Card 1: Crop */}
        <motion.div {...cardFadeUp(0.1)} className="report-metric-card">
          <div className="report-metric-icon-box">
            <Sprout style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="report-metric-label">Crop</div>
            <div className="report-metric-value">{crop}</div>
          </div>
          <div className="report-metric-sub">Observed Specimen</div>
        </motion.div>

        {/* Card 2: Disease */}
        <motion.div {...cardFadeUp(0.15)} className="report-metric-card">
          <div className="report-metric-icon-box">
            <Sun style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="report-metric-label">Disease</div>
            <div className="report-metric-value" style={{ fontSize: disease.length > 14 ? '1.1rem' : '1.25rem' }}>
              {disease}
            </div>
          </div>
          <div className="report-metric-sub">
            {diseaseConfidence.toFixed(1)}% confidence
          </div>
        </motion.div>

        {/* Card 3: Severity */}
        <motion.div {...cardFadeUp(0.2)} className="report-metric-card">
          <div className="report-metric-icon-box">
            <Gauge style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="report-metric-label">Severity</div>
            <div style={{ marginTop: '0.2rem' }}>
              <span className={`report-pill-badge ${
                isHealthy
                  ? 'pill-green'
                  : severityVal.toLowerCase() === 'mild'
                    ? 'pill-green'
                    : severityVal.toLowerCase() === 'severe'
                      ? 'pill-red'
                      : 'pill-amber'
              }`}>
                {severityVal}
              </span>
            </div>
          </div>
          <div className="report-metric-sub">
            {severityConfidence ? `${severityConfidence.toFixed(1)}% certainty` : 'Stage assessed'}
          </div>
        </motion.div>

        {/* Card 4: Expected Yield */}
        <motion.div {...cardFadeUp(0.25)} className="report-metric-card">
          <div className="report-metric-icon-box">
            <BarChart2 style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="report-metric-label">Expected Yield</div>
            <div className="report-metric-value">
              {predictedYield != null ? `${predictedYield} t/ha` : 'N/A'}
            </div>
          </div>
          <div className="report-metric-sub">Soil/Climate Regressor</div>
        </motion.div>

        {/* Card 5: Yield Risk */}
        <motion.div {...cardFadeUp(0.3)} className="report-metric-card">
          <div className="report-metric-icon-box">
            <Shield style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <div className="report-metric-label">Yield Risk</div>
            <div style={{ marginTop: '0.2rem' }}>
              <span className={`report-pill-badge ${
                yieldRisk.toLowerCase() === 'high'
                  ? 'pill-red'
                  : yieldRisk.toLowerCase() === 'medium'
                    ? 'pill-amber'
                    : 'pill-green'
              }`}>
                {yieldRisk}
              </span>
            </div>
          </div>
          <div className="report-metric-sub">Multi-signal synthesis</div>
        </motion.div>
      </div>

      {/* ═══════ 4. WHAT THIS MEANS (Reference 1) ═══════ */}
      <motion.div {...cardFadeUp(0.35)} className="report-means-card">
        {/* Header */}
        <div className="report-means-header">
          <div className="report-means-icon-circle">
            <Info style={{ width: '15px', height: '15px' }} />
          </div>
          <h3 className="report-means-title">What this means</h3>
        </div>

        {/* Subtitle */}
        <div className="report-means-subtitle">
          {isHealthy
            ? `Your ${crop} crop foliage is diagnosed as healthy with no active infection detected.`
            : `Your ${crop} crop has an ${severityVal.toLowerCase()}-stage ${disease} infection, graded ${severityVal}.`}
        </div>

        {/* 4 Inner Distinct Information Cards */}
        <div className="report-means-grid">
          {/* Card A: The infection */}
          <div className="report-inner-card">
            <div className="report-inner-header">
              <div className="report-inner-icon-box">
                <Sun style={{ width: '16px', height: '16px' }} />
              </div>
              <h4 className="report-inner-title">The infection</h4>
            </div>
            <p className="report-inner-text">
              {isHealthy
                ? `Confirmed healthy ${crop} tissue. No active chlorosis, foliar lesions, or mycelial growth detected.`
                : `${severityVal}-stage infection of ${crop} ${disease}, caused by the ${pathogenType.toLowerCase()} ${sciName || disease}${taxonomy ? ` (taxonomic category: ${taxonomy})` : ''}.`}
            </p>
          </div>

          {/* Card B: Severity */}
          <div className="report-inner-card">
            <div className="report-inner-header">
              <div className="report-inner-icon-box">
                <Gauge style={{ width: '16px', height: '16px' }} />
              </div>
              <h4 className="report-inner-title">Severity</h4>
            </div>
            <p className="report-inner-text">
              {isHealthy
                ? 'Disease grading is not applicable (0% disease progression). Vegetative photosynthesis is operating normally.'
                : `The machine learning model confirms a ${severityVal.toLowerCase()} severity grade (${severityConfidence ? severityConfidence.toFixed(1) + '% confidence' : diseaseConfidence.toFixed(1) + '% confidence'}).`}
            </p>
          </div>

          {/* Card C: Your environment */}
          <div className="report-inner-card">
            <div className="report-inner-header">
              <div className="report-inner-icon-box">
                <Droplets style={{ width: '16px', height: '16px' }} />
              </div>
              <h4 className="report-inner-title">Your environment</h4>
            </div>
            <div className="report-env-chips">
              <div className="report-stat-chip">
                <div className="report-stat-chip-val">{humidityVal}%</div>
                <div className="report-stat-chip-lbl">relative humidity</div>
              </div>
              <div className="report-stat-chip">
                <div className="report-stat-chip-val">{tempVal}°C</div>
                <div className="report-stat-chip-lbl">ambient temperature</div>
              </div>
            </div>
            <p className="report-inner-text">
              {isHealthy
                ? `Ambient readings provide favorable growth conditions for ${crop}. Continue routine canopy scouting.`
                : `These readings closely align with the ${humidityDesc}.`}
            </p>
          </div>

          {/* Card D: Missing data / Farm profile */}
          <div className="report-inner-card">
            <div className="report-inner-header">
              <div className="report-inner-icon-box">
                <AlertTriangle style={{ width: '16px', height: '16px' }} />
              </div>
              <h4 className="report-inner-title">
                {hasFarmData ? 'Farm soil context' : 'Missing data'}
              </h4>
            </div>
            <p className="report-inner-text">
              {hasFarmData ? (
                <>
                  Supplied parameters: Fertilizer <strong>{farmCtx.fertilizer || 'N/A'} kg/ha</strong>, N: <strong>{farmCtx.n || 'N/A'}</strong>, P: <strong>{farmCtx.p || 'N/A'}</strong>, K: <strong>{farmCtx.k || 'N/A'}</strong>.
                </>
              ) : (
                'Farm soil and fertilizer values were not supplied and are currently unavailable.'
              )}
            </p>
          </div>
        </div>

        {/* Highlighted Explanation Strip: Why it develops */}
        <div className="report-develops-strip">
          <Thermometer style={{ width: '18px', height: '18px', flexShrink: 0, color: '#d97706' }} />
          <div>
            <strong>Why it develops: </strong>
            {whyItDevelopsText}
          </div>
        </div>
      </motion.div>

      {/* ═══════ 5. SYMPTOMS & MANAGEMENT SIDE-BY-SIDE (Reference 1) ═══════ */}
      <div className="report-two-col-grid">
        {/* Left: Symptoms to Monitor (Amber Theme) */}
        <motion.div {...cardFadeUp(0.4)} className="report-side-card symptoms-card">
          <div className="report-side-header">
            <div className="report-side-icon-circle">
              <Eye style={{ width: '17px', height: '17px' }} />
            </div>
            <h3 className="report-side-title">Symptoms to Monitor</h3>
          </div>
          <div className="report-numbered-list">
            {symptomsList.map((item, idx) => (
              <div key={idx} className="report-numbered-item">
                <div className="report-number-badge">{idx + 1}</div>
                <p className="report-numbered-text">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Recommended Management (Green Theme) */}
        <motion.div {...cardFadeUp(0.45)} className="report-side-card management-card">
          <div className="report-side-header">
            <div className="report-side-icon-circle">
              <ShieldCheck style={{ width: '17px', height: '17px' }} />
            </div>
            <h3 className="report-side-title">Recommended Management</h3>
          </div>
          <div className="report-numbered-list">
            {managementList.map((item, idx) => (
              <div key={idx} className="report-numbered-item">
                <div className="report-number-badge">{idx + 1}</div>
                <p className="report-numbered-text">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══════ 6. COLLAPSIBLE BAR FOR DETAILED EXPLANATION ═══════ */}
      <button
        type="button"
        className="report-collapse-bar"
        onClick={() => setShowDetailedSections(!showDetailedSections)}
        aria-expanded={showDetailedSections}
      >
        <div className="report-collapse-left">
          <FileText style={{ width: '20px', height: '20px', color: '#16a34a' }} />
          <div>
            <div className="report-collapse-title">Detailed Disease-Specific Explanation</div>
            <div className="report-collapse-sub">
              Pathogen, conditions, transmission, prevention, severity interpretation &amp; expert advice triggers
            </div>
          </div>
        </div>
        <div className="report-collapse-btn">
          {showDetailedSections ? (
            <>
              <span>Collapse</span>
              <ChevronUp style={{ width: '15px', height: '15px' }} />
            </>
          ) : (
            <>
              <span>Expand</span>
              <ChevronDown style={{ width: '15px', height: '15px' }} />
            </>
          )}
        </div>
      </button>

      {/* ═══════ 7. DETAILED INFOGRAPHIC TIMELINE (Reference Design) ═══════ */}
      <AnimatePresence>
        {showDetailedSections && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            {/* Centered Heading */}
            <div className="report-section-header" style={{ marginBottom: '2.5rem' }}>
              <span className="report-section-kicker">04 — DEEP DIVE</span>
              <h2 className="report-section-title">
                Detailed Disease–Specific Explanation
              </h2>
              <div className="report-title-line" />
              <p className="report-section-subtitle">
                Pathogen, conditions, transmission, prevention, severity interpretation and expert advice triggers
              </p>
              <div className="report-identity-pill">
                <span>{crop}</span>
                <span>•</span>
                <span>{disease}</span>
                {sciName ? (
                  <>
                    <span>•</span>
                    <span style={{ fontStyle: 'italic' }}>{sciName}</span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Vertical Connected Infographic Timeline */}
            <div className="report-timeline-container">
              {/* Continuous vertical drawing timeline line */}
              <div className="report-timeline-line-track">
                <motion.div
                  className="report-timeline-line-progress"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
                />
              </div>

              {/* Sequential Timeline Items */}
              <motion.div
                variants={timelineContainerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column' }}
              >

                {/* 01 – Disease Overview */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    01
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Disease Overview</h4>
                      {sciName && (
                        <div className="report-timeline-tags">
                          <span className="report-timeline-tag tag-green">
                            Pathogen: <em style={{ marginLeft: '4px' }}>{sciName}</em>
                          </span>
                          {pathogenType && (
                            <span className="report-timeline-tag tag-green">{pathogenType}</span>
                          )}
                          {taxonomy && (
                            <span className="report-timeline-tag tag-green">{taxonomy}</span>
                          )}
                        </div>
                      )}
                      <p className="report-timeline-text">
                        {typeof sections.disease_overview === 'string' && sections.disease_overview.trim()
                          ? sections.disease_overview
                          : `${crop} ${disease} is a destructive foliar and fruit condition affecting ${crop.toLowerCase()} canopies. Prompt identification and environmental management mitigate defoliation, blossom blight, and severe yield reductions.`}
                      </p>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#16a34a' }}>
                      <FileText style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 02 – Favorable Conditions */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    02
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Favorable Conditions</h4>
                      {/* Dynamic condition tag chips */}
                      <div className="report-timeline-tags">
                        {sections.favorable_conditions?.temperature_range && (
                          <span className="report-timeline-tag tag-blue">{sections.favorable_conditions.temperature_range}</span>
                        )}
                        <span className="report-timeline-tag tag-blue">Humidity &gt;85%</span>
                        <span className="report-timeline-tag tag-blue">Long leaf wetness</span>
                        <span className="report-timeline-tag tag-blue">Dense canopy</span>
                        <span className="report-timeline-tag tag-blue">Restricted airflow</span>
                      </div>
                      <div className="report-timeline-text">
                        {typeof sections.favorable_conditions === 'string' ? (
                          <p style={{ margin: 0 }}>{sections.favorable_conditions}</p>
                        ) : (
                          <>
                            {sections.favorable_conditions?.humidity_moisture && (
                              <p style={{ margin: '0 0 0.35rem 0' }}>{sections.favorable_conditions.humidity_moisture}</p>
                            )}
                            {sections.favorable_conditions?.soil_conditions && (
                              <p style={{ margin: '0 0 0.35rem 0' }}>
                                <strong style={{ color: 'var(--forest-950)' }}>Soil parameters: </strong>
                                {sections.favorable_conditions.soil_conditions}
                              </p>
                            )}
                            {!sections.favorable_conditions?.humidity_moisture && (
                              <p style={{ margin: 0 }}>
                                Persistent high relative humidity exceeding 85%, prolonged canopy dampness, and restricted air circulation in shaded canopies accelerate sporulation and tissue penetration.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#2563eb' }}>
                      <Thermometer style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 03 – Characteristic Symptoms */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    03
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Characteristic Symptoms</h4>
                      <ul className="report-timeline-bullets">
                        {typeof sections.characteristic_symptoms === 'object' && sections.characteristic_symptoms ? (
                          <>
                            {sections.characteristic_symptoms.foliar_symptoms && (
                              <li className="report-timeline-bullet-item">
                                <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                                <span>
                                  <strong>Foliar: </strong>
                                  {Array.isArray(sections.characteristic_symptoms.foliar_symptoms)
                                    ? sections.characteristic_symptoms.foliar_symptoms.join(' ')
                                    : sections.characteristic_symptoms.foliar_symptoms}
                                </span>
                              </li>
                            )}
                            {sections.characteristic_symptoms.stem_and_fruit_symptoms && (
                              <li className="report-timeline-bullet-item">
                                <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                                <span>
                                  <strong>Stem &amp; Fruit: </strong>
                                  {Array.isArray(sections.characteristic_symptoms.stem_and_fruit_symptoms)
                                    ? sections.characteristic_symptoms.stem_and_fruit_symptoms.join(' ')
                                    : sections.characteristic_symptoms.stem_and_fruit_symptoms}
                                </span>
                              </li>
                            )}
                            {sections.characteristic_symptoms.progression && (
                              <li className="report-timeline-bullet-item">
                                <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                                <span>
                                  <strong>Progression: </strong>
                                  {sections.characteristic_symptoms.progression}
                                </span>
                              </li>
                            )}
                          </>
                        ) : typeof sections.characteristic_symptoms === 'string' ? (
                          <li className="report-timeline-bullet-item">
                            <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                            <span>{sections.characteristic_symptoms}</span>
                          </li>
                        ) : (
                          <>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                              <span><strong>Early: </strong>Pinpoint water-soaked or pale chlorotic spots on upper leaf surfaces.</span>
                            </li>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                              <span><strong>Developing: </strong>Expanding lesions with necrotic centers, chlorotic margins, and dense sporulation underneath.</span>
                            </li>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                              <span><strong>Severe: </strong>Extensive foliage blighting, rapid defoliation, and sunscald exposure on developing fruit.</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#d97706' }}>
                      <Leaf style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 04 – Transmission & Spread */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    04
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Transmission &amp; Spread</h4>
                      <div className="report-timeline-tags">
                        <span className="report-timeline-tag tag-purple">Wind currents</span>
                        <span className="report-timeline-tag tag-purple">Rain splash</span>
                        <span className="report-timeline-tag tag-purple">Overhead irrigation</span>
                        <span className="report-timeline-tag tag-purple">Crop debris</span>
                      </div>
                      <div className="report-timeline-text">
                        {typeof sections.transmission_and_spread === 'object' && sections.transmission_and_spread ? (
                          <>
                            {sections.transmission_and_spread.primary_vectors && (
                              <p style={{ margin: '0 0 0.35rem 0' }}>
                                {Array.isArray(sections.transmission_and_spread.primary_vectors)
                                  ? sections.transmission_and_spread.primary_vectors.join(' ')
                                  : sections.transmission_and_spread.primary_vectors}
                              </p>
                            )}
                            {sections.transmission_and_spread.survival_mechanism && (
                              <p style={{ margin: 0 }}>
                                <strong style={{ color: 'var(--forest-950)' }}>Survival mechanism: </strong>
                                {sections.transmission_and_spread.survival_mechanism}
                              </p>
                            )}
                          </>
                        ) : typeof sections.transmission_and_spread === 'string' ? (
                          <p style={{ margin: 0 }}>{sections.transmission_and_spread}</p>
                        ) : (
                          <p style={{ margin: 0 }}>
                            Conidia and spores travel rapidly on air currents, water splash, and worker handling. Pathogen structures persist on un-decomposed plant debris and trellising between crop cycles.
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#7c3aed' }}>
                      <Wind style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 05 – Prevention Practices */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    05
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Prevention Practices</h4>
                      <ul className="report-timeline-bullets">
                        {sections.prevention_practices && Array.isArray(sections.prevention_practices) && sections.prevention_practices.length > 0 ? (
                          sections.prevention_practices.map((p, i) => (
                            <li key={i} className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0d9488' }} />
                              <span>{p}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0d9488' }} />
                              <span>Provide generous spacing and prune suckers/lower foliage for continuous air movement and light penetration.</span>
                            </li>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0d9488' }} />
                              <span>Employ drip irrigation under plastic mulch to prevent foliage splash dispersal.</span>
                            </li>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0d9488' }} />
                              <span>Control broadleaf weed hosts and execute 2–3 year crop rotation away from susceptible host species.</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#0d9488' }}>
                      <Shield style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 06 – Recommended Management */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    06
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Recommended Management</h4>
                      <ul className="report-timeline-bullets">
                        {typeof sections.recommended_management === 'object' && sections.recommended_management?.cultural_controls ? (
                          sections.recommended_management.cultural_controls.map((c, i) => (
                            <li key={i} className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0284c7' }} />
                              <span>{c}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0284c7' }} />
                              <span>Prune and destroy infected leaves during warm, dry midday hours when spore release is minimal.</span>
                            </li>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#0284c7' }} />
                              <span>Sanitize greenhouse walls, trellising, benches, and shears immediately following harvest.</span>
                            </li>
                          </>
                        )}
                        {sections.recommended_management?.cautionary_dosage_note && (
                          <li className="report-timeline-bullet-item" style={{ marginTop: '0.4rem', color: '#92400e' }}>
                            <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#d97706' }} />
                            <span><strong>Caution: </strong>{sections.recommended_management.cautionary_dosage_note}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#0284c7' }}>
                      <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 07 – Severity Interpretation */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    07
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Severity Interpretation</h4>
                      <div style={{ marginBottom: '0.65rem' }}>
                        <span className={`report-pill-badge ${
                          isHealthy
                            ? 'pill-green'
                            : severityVal.toLowerCase() === 'mild'
                              ? 'pill-green'
                              : severityVal.toLowerCase() === 'severe'
                                ? 'pill-red'
                                : 'pill-amber'
                        }`}>
                          {isHealthy ? 'Healthy: 0%' : `Graded: ${severityVal}`}
                        </span>
                      </div>
                      <p className="report-timeline-text">
                        {typeof sections.severity_interpretation === 'string' && sections.severity_interpretation.trim()
                          ? sections.severity_interpretation
                          : isHealthy
                            ? 'No disease progression observed. Plant exhibits normal cell turgor and active chlorophyll.'
                            : `Severity is assessed as ${severityVal}, with a synthesized overall risk of ${overallRisk}${predictedYield != null ? ` and an expected yield of ${predictedYield} t/ha.` : '.'}`}
                      </p>

                      {/* Severity Track Gauge (Reference) */}
                      <div className="report-severity-track-wrapper">
                        <div className="report-severity-track">
                          <div
                            className="report-severity-indicator"
                            style={{ left: `${Math.max(4, Math.min(96, severityPercent))}%` }}
                          />
                        </div>
                        <div className="report-severity-labels">
                          <span style={{ color: severityVal.toLowerCase() === 'mild' || isHealthy ? '#16a34a' : 'inherit' }}>
                            {isHealthy ? 'Healthy' : 'Mild'}
                          </span>
                          <span style={{ color: severityVal.toLowerCase() === 'severe' ? '#dc2626' : 'inherit' }}>
                            Severe
                          </span>
                        </div>
                      </div>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#e11d48' }}>
                      <BarChart2 style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* 08 – Professional Advice Triggers */}
                <motion.div variants={timelineCardVariants} className="report-timeline-row">
                  <div className="report-timeline-node-dot" />
                  <motion.div variants={badgeVariants} className="report-timeline-badge">
                    08
                  </motion.div>
                  <div className="report-timeline-card">
                    <div className="report-timeline-card-main">
                      <h4 className="report-timeline-card-title">Professional Advice Triggers</h4>
                      <ul className="report-timeline-bullets">
                        {sections.professional_advice_triggers && Array.isArray(sections.professional_advice_triggers) && sections.professional_advice_triggers.length > 0 ? (
                          sections.professional_advice_triggers.map((t, i) => (
                            <li key={i} className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#9333ea' }} />
                              <span>{t}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#9333ea' }} />
                              <span>More than 25% of canopy shows velvety sporulation or necrotic spots despite lowering structure humidity.</span>
                            </li>
                            <li className="report-timeline-bullet-item">
                              <span className="report-timeline-bullet-dot" style={{ backgroundColor: '#9333ea' }} />
                              <span>Vascular wilting, fruit lesions or stem cankers appear, indicating a secondary viral or bacterial complex.</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                    <motion.div variants={iconBadgeVariants} className="report-timeline-icon-box" style={{ '--icon-theme': '#9333ea' }}>
                      <AlertTriangle style={{ width: '18px', height: '18px' }} />
                    </motion.div>
                  </div>
                </motion.div>

              </motion.div>
            </div>

            {/* ═══════ 8. AGRICULTURAL KNOWLEDGE SOURCES (Reference 2) ═══════ */}
            {sources && sources.length > 0 && (
              <motion.div {...cardFadeUp(0.48)} className="report-sources-wrapper">
                <div className="report-sources-backdrop" />
                <div className="report-sources-badge">
                  <BookOpen style={{ width: '22px', height: '22px' }} />
                </div>
                <div className="report-sources-surface">
                  <h3 className="report-sources-title">Agricultural Knowledge Sources</h3>
                  <div>
                    {sources.map((src, i) => (
                      <div key={i} className="report-source-row">
                        <div>
                          <span className="report-source-title">{src.title || src.organization}</span>
                          {src.organization && src.title && (
                            <span className="report-source-org"> — {src.organization}</span>
                          )}
                        </div>
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="report-source-link"
                          >
                            <span>Reference</span>
                            <ExternalLink style={{ width: '12px', height: '12px', display: 'inline', marginLeft: '3px' }} />
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Extension Fact Sheet</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════ 9. SCIENTIFIC DISCLAIMER FOOTER (Reference 2) ═══════ */}
            <div className="report-disclaimer-panel">
              <p className="report-disclaimer-text">
                Disclaimer: CropLens AI Assistant provides disease-specific agricultural guidance grounded in peer-reviewed extension references. It does not replace field inspection by a certified agronomist. Never apply chemical treatments based solely on AI model output.
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
