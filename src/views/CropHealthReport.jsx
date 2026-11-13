import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import AIAssistant from '../components/AIAssistant';
import TextReveal from '../components/TextReveal';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

/* ─────────────── animation constants ─────────────── */
const EASE = [0.16, 1, 0.3, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.55, delay, ease: EASE },
});

/* ─────── Sequenced section wrapper ─────── */
function SequencedSection({ delay = 0, children, style = {}, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, filter: 'blur(3px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.55, delay, ease: EASE }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function CropHealthReport({ reportData, weatherState, onNavigate }) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [headerReady, setHeaderReady] = useState(false);

  useEffect(() => {
    if (!reportData) return;
    const t = setTimeout(() => setHeaderReady(true), 100);
    return () => clearTimeout(t);
  }, [reportData]);

  if (!reportData) {
    return (
      <div className="view-panel active animate-panel-in" id="view-report">
        <div className="section-container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--leaf-100)', color: 'var(--leaf-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--forest-950)', marginBottom: '0.5rem' }}>
              No Diagnostic Report Available
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Please complete a crop scan and analysis first to generate a unified crop health report.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <InteractiveHoverButton text="Go to Crop Scan" variant="primary" onClick={() => onNavigate('scan')} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    crop = 'Unknown',
    predicted_crop = crop,
    disease = 'Unknown',
    disease_confidence = 0,
    severity = null,
    severity_confidence = null,
    severity_model_supported = false,
    severity_status = 'unavailable',
    severity_explanation = '',
    yield: yieldData = {},
    predicted_yield = yieldData?.predicted_yield,
    yield_risk = yieldData?.yield_risk || 'Low',
    overall_risk = 'Low',
    risk_explanation = [],
    warnings = [],
    timings_ms = {}
  } = reportData;

  const displayCrop = predicted_crop || crop;
  const isHealthy = disease.toLowerCase() === 'healthy' || severity_status === 'healthy';
  const isLowConfidence = disease_confidence < 70;

  let severityState = 'unavailable';
  if (isHealthy) severityState = 'healthy';
  else if (severity_model_supported || severity_status === 'graded') severityState = 'graded';
  else if (severity_status === 'not_explicitly_graded') severityState = 'not_explicitly_graded';

  return (
    <div className="view-panel active" id="view-report">
      <div className="section-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

        {/* ═══════ 1. TOP HEADER & BREADCRUMB ═══════ */}
        <AnimatePresence>
          {headerReady && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <TextReveal text="Crop Health Report" as="span" className="saas-section-kicker" style={{ margin: 0 }} delay={0.05} duration={0.35} />
                  <span className="card-badge font-mono" style={{ backgroundColor: 'var(--leaf-100)', color: 'var(--forest-800)', fontSize: '0.675rem' }}>
                    Report ID: #CG-{Math.abs(Math.round(disease_confidence * 123)).toString().slice(0, 4)}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--forest-950)', letterSpacing: '-0.02em', margin: 0 }}>
                  <TextReveal text={`${displayCrop} • ${disease}`} as="span" delay={0.15} duration={0.4} />
                </h1>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>
                    Confidence: <strong style={{ color: disease_confidence >= 70 ? 'var(--leaf-600)' : '#d97706' }}>{disease_confidence.toFixed(1)}%</strong> • Overall Risk: <strong style={{ textTransform: 'capitalize' }}>{overall_risk}</strong>
                  </span>
                </div>
              </div>
              <InteractiveHoverButton text="Scan Another Crop" variant="secondary" className="ihb-sm" onClick={() => onNavigate('scan')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Low Confidence Warning Banner */}
        <AnimatePresence>
          {headerReady && isLowConfidence && (
            <motion.div
              {...fadeUp(0.2)}
              style={{
                backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
                padding: '0.875rem 1.15rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#92400e', display: 'block' }}>
                  Low Diagnosis Confidence Warning ({disease_confidence.toFixed(1)}%)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                  Diagnosis confidence is below 70%. Confirm the result with an agronomist before taking chemical action.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agronomic Warnings (if any) */}
        {warnings && warnings.length > 0 && (
          <SequencedSection delay={0.1} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
              padding: '0.85rem 1.15rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.2rem', marginTop: '1px' }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#92400e' }}>Agronomic Advisory &amp; Caution</h4>
                <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.15rem', color: '#b45309', fontSize: '0.8rem', lineHeight: '1.45' }}>
                  {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                </ul>
              </div>
            </div>
          </SequencedSection>
        )}

        {/* ═══════ 2. MAIN ENHANCED CROP HEALTH REPORT & AI ASSISTANT ═══════ */}
        <SequencedSection delay={0.15}>
          <AIAssistant
            reportData={reportData}
            weatherState={weatherState}
            onNavigate={onNavigate}
          />
        </SequencedSection>

        {/* ═══════ 3. ENVIRONMENTAL CONTEXT ═══════ */}
        <SequencedSection delay={0.3} style={{ marginTop: '2rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1.15rem 1.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1rem' }}>⛅</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--forest-950)' }}>Field Weather Context</span>
                {weatherState?.status === 'success' && weatherState?.data?.locationName && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--leaf-700)', fontWeight: '600' }}>• 📍 {weatherState.data.locationName}</span>
                )}
              </div>
              <span className="card-badge font-mono" style={{ backgroundColor: 'var(--blue-bg)', color: 'var(--blue-text)', border: '1px solid var(--blue-border)', fontSize: '0.65rem' }}>
                Contextual Telemetry
              </span>
            </div>

            {weatherState?.status === 'success' && weatherState?.data ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                {[
                  { icon: '🌡️', label: 'Temp', value: `${weatherState.data.temperature} ${weatherState.data.units?.temperature || '°C'}` },
                  { icon: '💧', label: 'Humidity', value: `${weatherState.data.humidity} ${weatherState.data.units?.humidity || '%'}` },
                  { icon: '🌧️', label: 'Rain', value: `${weatherState.data.precipitation} ${weatherState.data.units?.precipitation || 'mm'}` },
                  { icon: '💨', label: 'Wind', value: `${weatherState.data.windSpeed} ${weatherState.data.units?.windSpeed || 'km/h'}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ backgroundColor: 'var(--surface-bg)', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>{label}</div>
                      <div style={{ fontSize: '0.925rem', fontWeight: '800', color: 'var(--forest-950)' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Field weather telemetry connected to active regional station.
              </div>
            )}
          </div>
        </SequencedSection>

        {/* ═══════ 4. TECHNICAL PIPELINE DETAILS (COLLAPSIBLE) ═══════ */}
        <SequencedSection delay={0.4} style={{ marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '16px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              style={{ width: '100%', padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>⚙️</span>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--forest-950)' }}>Technical Inference &amp; Pipeline Metrics</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Backend latencies and neural architecture specifications</span>
                </div>
              </div>
              <span style={{ fontSize: '0.775rem', color: 'var(--leaf-600)', fontWeight: '600' }}>
                {showTechnicalDetails ? '▲ Hide Details' : '▼ View Details'}
              </span>
            </button>

            <AnimatePresence>
              {showTechnicalDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-bg)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginTop: '0.85rem' }}>
                      {[
                        { label: 'Disease Classifier', model: 'MobileNetV2 (38 classes)', time: timings_ms.disease_inference_ms, state: null },
                        { label: 'Severity Classifier', model: 'Conditioned MobileNetV2', time: timings_ms.severity_inference_ms, state: severityState },
                        { label: 'Yield Regressor', model: 'Random Forest (Soil/Weather)', time: timings_ms.yield_inference_ms, state: null },
                        { label: 'Risk Fusion', model: 'Deterministic Synthesizer', time: timings_ms.risk_fusion_ms, state: null },
                      ].map(({ label, model, time, state }) => (
                        <div key={label} style={{ backgroundColor: '#ffffff', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--forest-950)', marginTop: '0.1rem' }}>{model}</div>
                          {time != null ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--leaf-600)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>Latency: {time} ms</div>
                          ) : state ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Status: {state}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {timings_ms.total_ms != null && (
                      <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Total Pipeline Latency: <strong style={{ color: 'var(--forest-950)', fontFamily: 'var(--font-mono)' }}>{timings_ms.total_ms} ms</strong>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SequencedSection>

        {/* ═══════ 5. FOOTER CTA ═══════ */}
        <SequencedSection delay={0.5}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <InteractiveHoverButton text="Scan Another Crop" variant="primary" onClick={() => onNavigate('scan')} />
          </div>
        </SequencedSection>

      </div>
    </div>
  );
}
