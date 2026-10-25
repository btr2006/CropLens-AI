import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import AIAssistant from '../components/AIAssistant';
import GlowCard from '../components/GlowCard';
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

/* ─────── Animated metric card ─────── */
function AnimatedMetricCard({ glowColor, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <GlowCard glowColor={glowColor}>
        {children}
      </GlowCard>
    </motion.div>
  );
}


export default function CropHealthReport({ reportData, weatherState, onNavigate }) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [headerReady, setHeaderReady] = useState(false);
  const [metricsReady, setMetricsReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);

  // Sequence: header → metrics → cards → AI assistant
  useEffect(() => {
    if (!reportData) return;
    const t1 = setTimeout(() => setHeaderReady(true), 100);
    const t2 = setTimeout(() => setMetricsReady(true), 800);
    const t3 = setTimeout(() => setCardsReady(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
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

  const getRiskBadgeClass = (riskLevel) => {
    switch ((riskLevel || '').toLowerCase()) {
      case 'low': return 'risk-badge-low';
      case 'medium': return 'risk-badge-medium';
      case 'high': return 'risk-badge-high';
      default: return 'risk-badge-neutral';
    }
  };

  return (
    <div className="view-panel active" id="view-report">
      <div className="section-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>

        {/* ═══════ 1. HEADER ═══════ */}
        <AnimatePresence>
          {headerReady && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <TextReveal text="Crop Health Report" as="span" className="saas-section-kicker" style={{ margin: 0 }} delay={0.05} duration={0.35} />
                  <span className="card-badge font-mono" style={{ backgroundColor: 'var(--leaf-100)', color: 'var(--forest-800)', fontSize: '0.675rem' }}>
                    Report ID: #CG-{Math.abs(Math.round(disease_confidence * 123)).toString().slice(0, 4)}
                  </span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--forest-950)', letterSpacing: '-0.02em', margin: 0 }}>
                  <TextReveal text={`${displayCrop} • ${disease}`} as="span" delay={0.15} duration={0.4} />
                </h1>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <TextReveal text="Here's what CropLens found in your crop." as="span" delay={0.3} duration={0.35} />
                  <span style={{ marginLeft: '0.4rem' }}>
                    Confidence: <strong style={{ color: disease_confidence >= 70 ? 'var(--leaf-600)' : '#d97706' }}>{disease_confidence.toFixed(1)}%</strong> • Overall Risk: <strong style={{ textTransform: 'capitalize' }}>{overall_risk}</strong>
                  </span>
                </div>
              </div>
              <InteractiveHoverButton text="Scan Another Crop" variant="secondary" className="ihb-sm" onClick={() => onNavigate('scan')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Low Confidence Warning */}
        <AnimatePresence>
          {headerReady && isLowConfidence && (
            <motion.div
              {...fadeUp(0.5)}
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

        {/* ═══════ 2. METRIC CARDS (GLOWCARDS) ═══════ */}
        <AnimatePresence>
          {metricsReady && (
            <div className="report-hero-metrics-grid">
              <AnimatedMetricCard glowColor="green" delay={0}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Identified Pathology</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--forest-950)', marginTop: '0.2rem' }}>{disease}</div>
                <div style={{ fontSize: '0.775rem', color: disease_confidence >= 70 ? 'var(--leaf-600)' : '#d97706', fontWeight: '600', marginTop: '0.15rem' }}>{disease_confidence.toFixed(1)}% model certainty</div>
              </AnimatedMetricCard>

              <AnimatedMetricCard glowColor="orange" delay={0.12}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Severity Assessment</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: severityState === 'graded' ? (severity === 'Severe' ? '#dc2626' : '#d97706') : 'var(--forest-950)', marginTop: '0.2rem' }}>
                  {severityState === 'graded' ? severity : (severityState === 'healthy' ? 'Healthy' : (severityState === 'not_explicitly_graded' ? 'General / Single-stage' : 'Unavailable'))}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {severityState === 'graded' ? `${severity_confidence ? severity_confidence.toFixed(1) + '% confidence' : 'Supported'}` : (severityState === 'healthy' ? 'Grading not required' : 'Not graded in data')}
                </div>
              </AnimatedMetricCard>

              <AnimatedMetricCard glowColor="green" delay={0.24}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Expected Yield</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--forest-950)', marginTop: '0.2rem' }}>{predicted_yield != null ? `${predicted_yield} t/ha` : 'N/A'}</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Soil/climate model estimate</div>
              </AnimatedMetricCard>

              <AnimatedMetricCard glowColor={overall_risk?.toLowerCase() === 'high' ? 'red' : (overall_risk?.toLowerCase() === 'low' ? 'green' : 'orange')} delay={0.36}>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Synthesized Risk</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={`risk-badge ${getRiskBadgeClass(overall_risk)}`}>{overall_risk} Risk</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Multi-signal risk fusion</div>
              </AnimatedMetricCard>
            </div>
          )}
        </AnimatePresence>

        {/* Agronomic Warnings */}
        {metricsReady && warnings && warnings.length > 0 && (
          <SequencedSection delay={0.2} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
              padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.2rem', marginTop: '1px' }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#92400e' }}>Agronomic Advisory &amp; Caution</h4>
                <ul style={{ margin: '0.35rem 0 0 0', paddingLeft: '1.15rem', color: '#b45309', fontSize: '0.825rem', lineHeight: '1.45' }}>
                  {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                </ul>
              </div>
            </div>
          </SequencedSection>
        )}

        {/* ═══════ 3. DETAILED RESULT CARDS ═══════ */}
        <AnimatePresence>
          {cardsReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}
            >
              {/* Card A: Disease Detection */}
              <motion.div {...fadeUp(0)} style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'var(--leaf-100)', color: 'var(--leaf-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--forest-950)' }}>Disease Analysis</h3>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected Condition</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--forest-950)', marginTop: '0.1rem' }}>{disease}</div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                    <span style={{ fontWeight: '700', color: 'var(--forest-950)' }}>{disease_confidence.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--surface-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(disease_confidence, 100)}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: EASE }}
                      style={{ height: '100%', backgroundColor: disease_confidence >= 70 ? 'var(--leaf-500)' : '#f59e0b', borderRadius: '9999px' }}
                    />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Evaluated using MobileNetV2 architecture across 38 crop pathology classes.
                </p>
              </motion.div>

              {/* Card B: Disease Severity */}
              <motion.div {...fadeUp(0.15)} style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'var(--leaf-100)', color: 'var(--leaf-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--forest-950)' }}>Disease Severity</h3>
                  </div>
                  {severityState === 'graded' && (
                    <span className="card-badge font-mono" style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.65rem' }}>Model Supported</span>
                  )}
                </div>

                {severityState === 'healthy' && (
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'var(--leaf-50)', border: '1px solid var(--leaf-100)', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--leaf-600)' }}>Healthy / No Grading Required</div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{severity_explanation || 'Crop diagnosed as healthy.'}</p>
                  </div>
                )}

                {severityState === 'graded' && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Severity Level</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: severity === 'Severe' ? '#dc2626' : '#d97706', marginTop: '0.1rem' }}>{severity || 'Assessed'}</div>
                      </div>
                      {severity_confidence != null && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--forest-950)', marginTop: '0.1rem' }}>{severity_confidence.toFixed(1)}%</div>
                        </div>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{severity_explanation || 'Assessed with disease-conditioned severity model.'}</p>
                  </div>
                )}

                {severityState === 'not_explicitly_graded' && (
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#92400e' }}>General / Single-stage</div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{severity_explanation || 'Training data identifies disease presence without Mild/Severe labels.'}</p>
                  </div>
                )}

                {severityState === 'unavailable' && (
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-body)' }}>Unavailable</div>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{severity_explanation || 'Trained severity model is unavailable for this crop/disease.'}</p>
                  </div>
                )}
              </motion.div>

              {/* Card C: Yield & Risk */}
              <motion.div {...fadeUp(0.3)} style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: 'var(--forest-950)', color: 'var(--leaf-300)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--forest-950)' }}>Risk Synthesis</h3>
                  </div>
                  <span className={`risk-badge ${getRiskBadgeClass(overall_risk)}`}>{overall_risk}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
                  {risk_explanation && risk_explanation.length > 0 ? (
                    risk_explanation.slice(0, 3).map((exp, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.775rem', color: 'var(--forest-950)', lineHeight: '1.4' }}>
                        <span style={{ color: 'var(--leaf-600)', fontWeight: '700' }}>✓</span>
                        <span>{exp}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No additional risk explanation.</span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  Synthesizes leaf pathology, soil feature regression, and climatic parameters into a single actionable risk score.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ 4. AI ASSISTANT ═══════ */}
        {cardsReady && (
          <SequencedSection delay={0.1}>
            <AIAssistant reportData={reportData} weatherState={weatherState} />
          </SequencedSection>
        )}

        {/* ═══════ 5. ENVIRONMENTAL CONTEXT ═══════ */}
        {cardsReady && (
          <SequencedSection delay={0.3} style={{ marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1rem' }}>⛅</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--forest-950)' }}>Environmental Context</span>
                  {weatherState?.status === 'success' && weatherState?.data?.locationName && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--leaf-700)', fontWeight: '600' }}>• 📍 {weatherState.data.locationName}</span>
                  )}
                </div>
                <span className="card-badge font-mono" style={{ backgroundColor: 'var(--blue-bg)', color: 'var(--blue-text)', border: '1px solid var(--blue-border)', fontSize: '0.65rem' }}>
                  Contextual Only (Non-ML)
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
                    <div key={label} style={{ backgroundColor: 'var(--surface-bg)', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  Regional weather information unavailable (does not alter ML yield or disease models).
                </div>
              )}
            </div>
          </SequencedSection>
        )}

        {/* ═══════ 6. TECHNICAL DETAILS ═══════ */}
        {cardsReady && (
          <SequencedSection delay={0.5} style={{ marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: '14px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                style={{ width: '100%', padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>⚙️</span>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--forest-950)' }}>Technical Inference &amp; Pipeline Metrics</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Measured backend latencies and model specifications</span>
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
                          <div key={label} style={{ backgroundColor: '#ffffff', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
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
        )}

        {/* Footer CTA */}
        {cardsReady && (
          <SequencedSection delay={0.6}>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <InteractiveHoverButton text="Scan Another Crop" variant="primary" onClick={() => onNavigate('scan')} />
            </div>
          </SequencedSection>
        )}

      </div>
    </div>
  );
}
