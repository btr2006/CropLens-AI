import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAIExplanation, GEMINI_MODEL } from '../services/aiAssistantService';
import {
  buildFarmerSpeechScript,
  splitIntoSpeechChunks,
  getAvailableEnglishVoices,
  selectBestVoice,
} from '../services/voiceTextService';
import TextReveal from './TextReveal';
import MagicText from './MagicText';
import { TextEffect } from '@/components/ui/text-effect';

export default function AIAssistant({ reportData, weatherState }) {
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

  // Load available English voices asynchronously
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = getAvailableEnglishVoices();
      setAvailableVoices(voices);
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

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Stop active speech if explanation changes or regenerated
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
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      if (!isCancelledRef.current) {
        setIsSpeaking(true);
      }
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
    if (!speechSupported) {
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    // Cancel any previous utterances before starting new speech
    stopSpeech();
    isCancelledRef.current = false;

    // Build the clean, pronunciation-normalized farmer script dynamically
    const script = buildFarmerSpeechScript(explanation, reportData, weatherState);
    if (!script) return;

    // Split into sentence-bounded chunks to avoid browser timeout while preserving words
    const chunks = splitIntoSpeechChunks(script, 220);
    if (!chunks || chunks.length === 0) return;

    chunksQueueRef.current = chunks;
    activeChunkIndexRef.current = 0;

    const voice = selectBestVoice(availableVoices, selectedVoiceURI);
    speakChunksSequentially(chunks, voice, speechRate);
  };

  if (!reportData || reportData.crop_mismatch) return null;

  return (
    <div
      className="bg-white animate-panel-in"
      style={{
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              backgroundColor: 'var(--forest-950)',
              color: 'var(--leaf-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--forest-950)' }}>
              CropLens AI Assistant
            </h3>
            <TextReveal
              text="Understand your crop result in simple language."
              as="span"
              delay={0.1}
              duration={0.35}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
            />
          </div>
        </div>


        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Status Badge */}
          {explanation?.isFallback ? (
            <span
              className="card-badge font-mono"
              style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontSize: '0.7rem' }}
            >
              Basic Mode
            </span>
          ) : explanation?.usedCustomKey ? (
            <span
              className="card-badge font-mono"
              style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.7rem' }}
            >
              Gemini Connected (Custom Key)
            </span>
          ) : (
            <span
              className="card-badge font-mono"
              style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.7rem' }}
            >
              Gemini Connected ({explanation?.usedModel || GEMINI_MODEL})
            </span>
          )}

          {/* Language Selector Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--warm-100)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--warm-200)',
              fontSize: '0.75rem',
            }}
          >
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontWeight: '700',
                color: 'var(--forest-950)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              English
            </span>
            <span
              title="Telugu translation coming soon in next release"
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                color: 'var(--earth-muted)',
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
            >
              తెలుగు (Coming Soon)
            </span>
          </div>

          {/* Voice Playback & Audio Controls */}
          {speechSupported ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {/* Listen / Stop Button */}
              <button
                type="button"
                className="btn-tap"
                aria-label={isSpeaking ? 'Stop AI voice playback' : 'Listen to AI explanation with speech synthesis'}
                disabled={loading || !explanation}
                onClick={handleToggleSpeech}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: isSpeaking ? '1px solid #fca5a5' : '1px solid #bbf7d0',
                  backgroundColor: isSpeaking ? '#fee2e2' : '#f0fdf4',
                  color: isSpeaking ? '#b91c1c' : '#15803d',
                  cursor: loading || !explanation ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSpeaking ? (
                  <>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#dc2626', borderRadius: '2px' }}></span>
                    <span>⏹ Stop</span>
                  </>
                ) : (
                  <>
                    <span>🔊 Listen</span>
                  </>
                )}
              </button>

              {/* Voice Selector */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: 'var(--warm-100)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--warm-200)',
                  fontSize: '0.75rem',
                }}
              >
                <label htmlFor="ai-voice-select" style={{ color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>
                  Voice:
                </label>
                <select
                  id="ai-voice-select"
                  aria-label="Select English voice for speech synthesis"
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--forest-950)',
                    cursor: 'pointer',
                    outline: 'none',
                    maxWidth: '150px',
                  }}
                >
                  <option value="auto">Auto (Best English)</option>
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Selector */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: 'var(--warm-100)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--warm-200)',
                  fontSize: '0.75rem',
                }}
              >
                <label htmlFor="ai-speed-select" style={{ color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>
                  Speed:
                </label>
                <select
                  id="ai-speed-select"
                  aria-label="Select speech playback speed"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--forest-950)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="0.9">0.9x</option>
                  <option value="0.95">0.95x (Default)</option>
                  <option value="1.0">1.0x</option>
                  <option value="1.1">1.1x</option>
                </select>
              </div>
            </div>
          ) : (
            <span
              className="font-mono"
              style={{ fontSize: '0.75rem', color: 'var(--earth-muted)', backgroundColor: 'var(--warm-100)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}
            >
              Voice unavailable in this browser
            </span>
          )}

          <button
            type="button"
            className="btn-secondary-hero btn-tap"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', borderRadius: '8px' }}
            onClick={() => setShowKeyPanel(!showKeyPanel)}
          >
            {activeCustomKey ? 'Key Connected' : 'Connect Your Gemini API Key'}
          </button>

          <button
            type="button"
            className="btn-secondary-hero btn-tap"
            disabled={loading}
            style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem', borderRadius: '8px' }}
            onClick={() => handleGenerate(activeCustomKey)}
          >
            {loading ? 'Analyzing...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Optional BYOK API Key Panel */}
      {showKeyPanel && (
        <div
          style={{
            backgroundColor: 'var(--warm-50)',
            border: '1px solid var(--warm-300)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: 'var(--forest-950)' }}>
              Connect Your Gemini API Key
            </h4>
            <span
              className="font-mono"
              style={{ fontSize: '0.75rem', color: 'var(--earth-muted)', backgroundColor: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--warm-200)' }}
            >
              Optional — for extended AI consultation
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--forest-900)', margin: '0 0 0.875rem 0', lineHeight: '1.45' }}>
            Your key is kept only in temporary session memory, never saved to storage, never logged, and never sent to our ML server.
          </p>

          <form onSubmit={handleApplyCustomKey} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="Paste your Gemini API key (AIzaSy...)"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              style={{
                flex: '1',
                minWidth: '240px',
                padding: '0.5rem 0.875rem',
                borderRadius: '8px',
                border: '1px solid var(--warm-300)',
                fontSize: '0.875rem',
                backgroundColor: 'white',
              }}
            />
            <button
              type="submit"
              className="btn-primary-hero btn-tap"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: '8px' }}
            >
              Use Custom Key
            </button>
            {activeCustomKey && (
              <button
                type="button"
                className="btn-secondary-hero btn-tap"
                onClick={handleClearCustomKey}
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', borderRadius: '8px', color: '#b91c1c' }}
              >
                Clear Key
              </button>
            )}
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <div
            className="status-dot green pulse"
            style={{ width: '12px', height: '12px', margin: '0 auto 0.75rem' }}
          ></div>
          <span style={{ fontSize: '0.9375rem', color: 'var(--forest-900)', fontWeight: '600' }}>
            CropLens AI Assistant is synthesizing ML results &amp; environmental context...
          </span>
        </div>
      )}

      {/* Main Content */}
      {!loading && explanation && (
        <div>
          {/* Fallback Notice Banner if applicable */}
          {explanation.isFallback && (
            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '0.875rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
                color: '#9a3412',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
              }}
            >
              <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <strong>Gemini is temporarily unavailable. Showing a grounded basic explanation from the ML result.</strong>
                {explanation.fallbackReason && (
                  <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>
                    Reason: {explanation.fallbackReason}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Prominent Warning Box for Low Confidence or Critical Alerts */}
          {explanation.warning && (
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
              <div style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }}>
                <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: '700', color: '#991b1b' }}>
                  Diagnostic Advisory
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#7f1d1d', lineHeight: '1.45' }}>
                  {explanation.warning}
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4
              style={{
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--earth-muted)',
                fontWeight: '700',
                margin: '0 0 0.375rem 0',
              }}
            >
              Summary
            </h4>
            <TextEffect
              key={`summary-${explanation?.summary}`}
              per="word"
              preset="fade"
              as="p"
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--forest-950)',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              {explanation.summary}
            </TextEffect>
          </div>

          {/* What This Means */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4
              style={{
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--earth-muted)',
                fontWeight: '700',
                margin: '0 0 0.375rem 0',
              }}
            >
              What This Means
            </h4>
            <TextEffect
              key={`means-${explanation?.what_it_means}`}
              per="word"
              preset="fade"
              as="p"
              delay={0.12}
              style={{
                fontSize: '0.9375rem',
                color: 'var(--forest-900)',
                margin: 0,
                lineHeight: '1.55',
              }}
            >
              {explanation.what_it_means}
            </TextEffect>
          </div>

          {/* 2-Column Grid: What To Monitor & Next Steps (Sequenced After Text) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginTop: '1.25rem',
            }}
          >
            {/* What To Monitor */}
            <div
              style={{
                backgroundColor: 'var(--warm-50)',
                padding: '1.125rem',
                borderRadius: '14px',
                border: '1px solid var(--warm-200)',
              }}
            >
              <h5
                style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: 'var(--forest-950)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg style={{ width: '18px', height: '18px', flexShrink: 0, color: 'var(--leaf-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                What To Monitor
              </h5>
              <MagicText
                mode="list"
                items={explanation.what_to_monitor && explanation.what_to_monitor.length > 0 ? explanation.what_to_monitor : ['Monitor foliage condition and soil moisture regularly.']}
                resetKey={explanation}
              />
            </div>

            {/* Next Steps */}
            <div
              style={{
                backgroundColor: 'var(--warm-50)',
                padding: '1.125rem',
                borderRadius: '14px',
                border: '1px solid var(--warm-200)',
              }}
            >
              <h5
                style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: 'var(--forest-950)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg style={{ width: '18px', height: '18px', flexShrink: 0, color: 'var(--leaf-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Next Steps
              </h5>
              <MagicText
                mode="list"
                items={explanation.next_steps && explanation.next_steps.length > 0 ? explanation.next_steps : ['Follow standard cultural and sanitation best practices.']}
                resetKey={explanation}
              />
            </div>
          </motion.div>
        </div>
      )}


      {/* Footer Disclaimer */}
      <div style={{ marginTop: '1.25rem', paddingTop: '0.875rem', borderTop: '1px solid var(--warm-200)' }}>
        <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--earth-muted)', lineHeight: '1.4' }}>
          Disclaimer: CropLens AI Assistant provides non-chemical guidance to explain ML model outputs. It does not replace field inspection by a certified agronomic specialist.
        </p>
      </div>
    </div>
  );
}
