import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ────────────────────────── animation primitives ────────────────────────── */
const EASE_SMOOTH = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(3px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE_SMOOTH },
  },
};

const pulseGlow = {
  boxShadow: [
    '0 0 0 0 rgba(46, 158, 91, 0)',
    '0 0 0 8px rgba(46, 158, 91, 0.15)',
    '0 0 0 0 rgba(46, 158, 91, 0)',
  ],
};

/* ──────────────── synchronized status text sequences ────────────────────── */
const STAGE_1_STEPS = [
  'Initializing image analysis...',
  'Checking leaf image...',
  'Extracting visual features...',
  'Detecting disease patterns...',
  'Estimating disease severity...',
  'Verifying image analysis...',
];

const STAGE_2_STEPS = [
  'Preparing farm parameters...',
  'Analyzing soil conditions...',
  'Processing weather parameters...',
  'Evaluating farm inputs...',
  'Running yield prediction model...',
  'Calculating expected yield...',
  'Verifying yield prediction...',
];

const STAGE_3_STEPS = [
  'Combining prediction results...',
  'Evaluating disease severity impact...',
  'Comparing expected yield...',
  'Assessing potential yield risk...',
  'Calculating risk level...',
  'Generating recommendation...',
  'Final verification...',
];

/* ──────────────────────── timeline status icons ─────────────────────────── */
function TimelineIcon({ state }) {
  const base = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '0.85rem',
    fontWeight: 'bold',
    transition: 'all 0.4s ease',
  };

  if (state === 'verified') {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{ ...base, backgroundColor: '#15803d', color: '#ffffff', boxShadow: '0 0 12px rgba(21, 128, 61, 0.4)' }}
      >
        ✓
      </motion.div>
    );
  }

  if (state === 'processing') {
    return (
      <motion.div
        animate={pulseGlow}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{
          ...base,
          backgroundColor: '#ffffff',
          border: '2.5px solid var(--leaf-500)',
          color: 'var(--leaf-600)',
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--leaf-600)',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }}
        />
      </motion.div>
    );
  }

  if (state === 'error') {
    return <div style={{ ...base, backgroundColor: '#fee2e2', color: '#b91c1c', border: '1.5px solid #fca5a5' }}>✕</div>;
  }

  // Waiting
  return <div style={{ ...base, backgroundColor: '#f1f5f9', border: '1.5px solid #cbd5e1', color: '#94a3b8' }}>○</div>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                          MAIN PROCESSING VIEW                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ProcessingView({
  stagesState,
  reportData,
  imagePreview,
  imageMeta,
  weatherState,
  locationName,
  error,
  mismatchData,
  rejectionData,
  timings,
  onRetry,
  onAutoDetectCrop,
  onNavigate,
}) {
  // 3 Stage States: 'waiting' | 'processing' | 'verified' | 'error'
  const [s1State, setS1State] = useState('processing');
  const [s2State, setS2State] = useState('waiting');
  const [s3State, setS3State] = useState('waiting');

  // Text step indices
  const [s1TextIdx, setS1TextIdx] = useState(0);
  const [s2TextIdx, setS2TextIdx] = useState(0);
  const [s3TextIdx, setS3TextIdx] = useState(0);

  // Card Refs for smooth auto-scroll
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);
  const reportRef = useRef(null);

  // Extract real model results
  const crop = reportData?.predicted_crop || reportData?.crop || stagesState?.disease_analysis?.details?.crop || 'Crop Specimen';
  const disease = reportData?.disease || stagesState?.disease_analysis?.details?.disease || 'Pathology Analysis';
  const diseaseConf = reportData?.disease_confidence ?? stagesState?.disease_analysis?.details?.confidence ?? 0;
  const severity = reportData?.severity || stagesState?.severity_assessment?.details?.severity || 'Assessed';
  const severityConf = reportData?.severity_confidence ?? stagesState?.severity_assessment?.details?.severity_confidence ?? 0;

  const yieldVal = reportData?.predicted_yield ?? reportData?.yield?.predicted_yield ?? stagesState?.yield_prediction?.details?.predicted_yield ?? null;
  const overallRisk = reportData?.overall_risk || stagesState?.risk_fusion?.details?.overall_risk || 'Evaluated';
  const yieldRisk = reportData?.yield_risk || stagesState?.yield?.yield_risk || 'Low';
  const recommendation = reportData?.risk_explanation?.[0] || 'Follow standard agronomic guidelines for foliage health.';

  // ──── Stage 1 Timer & Verification ────
  useEffect(() => {
    if (s1State !== 'processing') return;

    if (card1Ref.current) {
      card1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const interval = setInterval(() => {
      setS1TextIdx((prev) => {
        if (prev < STAGE_1_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [s1State]);

  useEffect(() => {
    if (s1State === 'processing' && (reportData || stagesState?.disease_analysis?.status === 'complete')) {
      const timer = setTimeout(() => {
        setS1State('verified');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [s1State, reportData, stagesState?.disease_analysis]);

  // ──── Stage 2 Start & Verification ────
  useEffect(() => {
    if (s1State === 'verified' && s2State === 'waiting') {
      const timer = setTimeout(() => {
        setS2State('processing');
        if (card2Ref.current) {
          card2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [s1State, s2State]);

  useEffect(() => {
    if (s2State !== 'processing') return;

    const interval = setInterval(() => {
      setS2TextIdx((prev) => {
        if (prev < STAGE_2_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [s2State]);

  useEffect(() => {
    if (s2State === 'processing' && (reportData || stagesState?.yield_prediction?.status === 'complete')) {
      const timer = setTimeout(() => {
        setS2State('verified');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [s2State, reportData, stagesState?.yield_prediction]);

  // ──── Stage 3 Start & Verification ────
  useEffect(() => {
    if (s2State === 'verified' && s3State === 'waiting') {
      const timer = setTimeout(() => {
        setS3State('processing');
        if (card3Ref.current) {
          card3Ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [s2State, s3State]);

  useEffect(() => {
    if (s3State !== 'processing') return;

    const interval = setInterval(() => {
      setS3TextIdx((prev) => {
        if (prev < STAGE_3_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [s3State]);

  useEffect(() => {
    if (s3State === 'processing' && (reportData || stagesState?.analysis_complete?.status === 'complete')) {
      const timer = setTimeout(() => {
        setS3State('verified');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [s3State, reportData, stagesState?.analysis_complete]);

  // Scroll to report reveal when all 3 stages reach verified
  useEffect(() => {
    if (s1State === 'verified' && s2State === 'verified' && s3State === 'verified') {
      const timer = setTimeout(() => {
        if (reportRef.current) {
          reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [s1State, s2State, s3State]);

  // ──── Rejection / Error Handling ────
  const activeRejection =
    rejectionData ||
    (stagesState?.leaf_validation?.status === 'rejected' ? stagesState?.leaf_validation?.details : null) ||
    (stagesState?.image_validation?.status === 'rejected' ? stagesState?.image_validation?.details : null);

  if (activeRejection) {
    return (
      <div className="view-panel active animate-panel-in" id="view-processing">
        <div className="section-container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE_SMOOTH }}
              className="bg-white"
              style={{ borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid #fca5a5', textAlign: 'center' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem', fontWeight: '700' }}>
                ✕
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#991b1b', marginBottom: '0.75rem' }}>
                Input Validation Gate Rejected
              </h2>
              <p style={{ fontSize: '0.925rem', color: '#475569', marginBottom: '1.5rem' }}>
                {activeRejection.image_rejection_reason || "CropLens AI could not identify a valid plant leaf specimen in the uploaded image."}
              </p>
              <button type="button" className="btn-primary-hero btn-tap" onClick={() => onNavigate && onNavigate('scan')}>
                Choose Another Image
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (mismatchData) {
    return (
      <div className="view-panel active animate-panel-in" id="view-processing">
        <div className="section-container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white"
              style={{ borderRadius: '24px', padding: '2.25rem 2rem', border: '1px solid #fed7aa', textAlign: 'center' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--forest-950)', marginBottom: '1rem' }}>
                Crop Mismatch Detected
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
                {mismatchData.message || `Uploaded image is ${mismatchData.predicted_crop}, but ${mismatchData.selected_crop} was selected.`}
              </p>
              <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center' }}>
                <button type="button" className="btn-primary-hero btn-tap" onClick={() => onNavigate('scan')}>Back to Scan</button>
                <button type="button" className="btn-secondary-hero btn-tap" onClick={() => onAutoDetectCrop && onAutoDetectCrop(mismatchData.predicted_crop)}>Use Auto-Detect</button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-panel active animate-panel-in" id="view-processing">
        <div className="section-container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
            <div className="bg-white" style={{ borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid #fca5a5' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#991b1b', marginBottom: '1rem' }}>Processing Failed</h2>
              <p style={{ color: '#7f1d1d', marginBottom: '1.5rem' }}>{error}</p>
              <button type="button" className="btn-primary-hero btn-tap" onClick={onRetry}>Retry Analysis</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allVerified = s1State === 'verified' && s2State === 'verified' && s3State === 'verified';

  return (
    <div className="view-panel active animate-panel-in" id="view-processing">
      <div className="section-container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_SMOOTH }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', backgroundColor: 'var(--leaf-50)', border: '1px solid var(--leaf-200)', marginBottom: '0.75rem' }}>
            <span className="pulsing-ping green" style={{ width: '8px', height: '8px', position: 'relative' }}></span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--leaf-800)', letterSpacing: '0.02em' }}>
              3-Stage Sequential Pipeline Execution
            </span>
          </div>
          <h1 className="section-heading" style={{ fontSize: '2.1rem' }}>
            Analyzing Crop Health
          </h1>
          <p className="section-subheading" style={{ maxWidth: '560px', margin: '0.5rem auto 0', fontSize: '0.9375rem' }}>
            Executing pathology vision, agronomic yield regression, and risk assessment in sequence.
          </p>
        </motion.div>

        {/* 2-Column Layout: Leaf Anchor + 3 Stage Pipeline */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 360px) 1fr',
            gap: '2.5rem',
            alignItems: 'start',
            maxWidth: '1100px',
            margin: '0 auto',
          }}
        >
          {/* LEFT: Leaf Specimen & Scanner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_SMOOTH }}
            className="bg-white"
            style={{
              borderRadius: '24px',
              padding: '1.35rem',
              border: '1px solid var(--warm-200)',
              boxShadow: '0 12px 32px -8px rgba(11, 51, 31, 0.08)',
              position: 'sticky',
              top: '5.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--leaf-800)' }}>
                Target Specimen
              </span>
              <span className="font-mono" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                {imageMeta?.name || 'leaf_sample.jpg'}
              </span>
            </div>

            {/* Specimen Frame with Scanning Animation */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a', aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(46, 158, 91, 0.25)' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Uploaded Crop Leaf" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Leaf image specimen</div>
              )}

              {/* Scanning Laser Line (Active during Stage 1) */}
              {s1State === 'processing' && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.0, ease: 'easeInOut', repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    left: 0, right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent)',
                    boxShadow: '0 0 14px 3px rgba(34, 197, 94, 0.9)',
                    zIndex: 10,
                  }}
                />
              )}

              {/* Reticle Overlay Frame */}
              {s1State === 'processing' && (
                <div
                  style={{
                    position: 'absolute', inset: '12%',
                    border: '2px dashed #34d399', borderRadius: '20px',
                    boxShadow: '0 0 20px rgba(52, 211, 153, 0.3) inset',
                    pointerEvents: 'none', zIndex: 9,
                  }}
                />
              )}

              {/* Reticle Corners */}
              <div style={{ position: 'absolute', top: '8px', left: '8px', width: '14px', height: '14px', borderTop: '2.5px solid #22c55e', borderLeft: '2.5px solid #22c55e' }} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '14px', height: '14px', borderTop: '2.5px solid #22c55e', borderRight: '2.5px solid #22c55e' }} />
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '14px', height: '14px', borderBottom: '2.5px solid #22c55e', borderLeft: '2.5px solid #22c55e' }} />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '14px', height: '14px', borderBottom: '2.5px solid #22c55e', borderRight: '2.5px solid #22c55e' }} />
            </div>

            {/* Specimen Info */}
            <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.775rem' }}>
              <div style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', backgroundColor: 'var(--warm-100)', border: '1px solid var(--warm-200)' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.675rem' }}>REGION</span>
                <strong style={{ color: 'var(--forest-900)' }}>{locationName || 'Field Region'}</strong>
              </div>
              <div style={{ padding: '0.5rem 0.65rem', borderRadius: '8px', backgroundColor: 'var(--warm-100)', border: '1px solid var(--warm-200)' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.675rem' }}>BACKEND</span>
                <strong style={{ color: 'var(--leaf-700)' }}>FastAPI ML</strong>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: EXACTLY 3 STAGE PIPELINE CARDS */}
          <div style={{ position: 'relative' }}>

            {/* ════════ STAGE 1: DISEASE DETECTION & SEVERITY ════════ */}
            <div ref={card1Ref} style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TimelineIcon state={s1State} />
                <div
                  style={{
                    width: '3px', flex: 1, minHeight: '80px',
                    backgroundColor: s1State === 'verified' ? '#15803d' : '#e2e8f0',
                    transition: 'background-color 0.5s ease', marginTop: '0.5rem',
                  }}
                />
              </div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                style={{
                  flex: 1, backgroundColor: '#ffffff', borderRadius: '20px', padding: '1.35rem 1.5rem',
                  border: `2px solid ${s1State === 'processing' ? 'var(--leaf-500)' : s1State === 'verified' ? '#bbf7d0' : 'var(--warm-200)'}`,
                  boxShadow: s1State === 'processing' ? '0 10px 30px -5px rgba(34, 197, 94, 0.15)' : '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'all 0.35s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="card-badge font-mono" style={{ backgroundColor: 'var(--leaf-100)', color: 'var(--forest-900)', fontSize: '0.72rem', fontWeight: '700' }}>
                    STAGE 1 OF 3
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: s1State === 'verified' ? '#15803d' : s1State === 'processing' ? 'var(--leaf-600)' : '#94a3b8' }}>
                    {s1State === 'verified' ? '✓ Stage 1 Verified' : s1State === 'processing' ? 'Processing...' : 'Waiting'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--forest-950)', margin: '0 0 0.25rem 0' }}>
                  DISEASE DETECTION &amp; SEVERITY
                </h3>

                {/* Synchronized Text Step */}
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: s1State === 'verified' ? '#15803d' : 'var(--leaf-700)', minHeight: '24px', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  {s1State === 'processing' && (
                    <span className="pulsing-ping green" style={{ width: '7px', height: '7px' }} />
                  )}
                  <span>{s1State === 'verified' ? '✓ Stage 1 Verified' : STAGE_1_STEPS[s1TextIdx]}</span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <motion.div
                    animate={{ width: s1State === 'verified' ? '100%' : `${Math.round(((s1TextIdx + 1) / STAGE_1_STEPS.length) * 100)}%` }}
                    transition={{ duration: 0.4 }}
                    style={{ height: '100%', backgroundColor: s1State === 'verified' ? '#15803d' : 'var(--leaf-500)', borderRadius: '999px' }}
                  />
                </div>

                {/* Verified Actual Output Results */}
                {s1State === 'verified' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.675rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Crop</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--forest-950)' }}>{crop}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.675rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Disease</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--forest-950)' }}>
                        {disease} <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700' }}>({diseaseConf.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.675rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Severity</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: severity === 'Severe' ? '#dc2626' : '#d97706' }}>
                        {severity} {severityConf ? `(${severityConf.toFixed(1)}%)` : ''}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>


            {/* ════════ STAGE 2: YIELD PREDICTION ════════ */}
            <div ref={card2Ref} style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.25rem', opacity: s2State === 'waiting' ? 0.6 : 1, transition: 'opacity 0.4s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TimelineIcon state={s2State} />
                <div
                  style={{
                    width: '3px', flex: 1, minHeight: '80px',
                    backgroundColor: s2State === 'verified' ? '#15803d' : '#e2e8f0',
                    transition: 'background-color 0.5s ease', marginTop: '0.5rem',
                  }}
                />
              </div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                style={{
                  flex: 1, backgroundColor: '#ffffff', borderRadius: '20px', padding: '1.35rem 1.5rem',
                  border: `2px solid ${s2State === 'processing' ? 'var(--leaf-500)' : s2State === 'verified' ? '#bbf7d0' : 'var(--warm-200)'}`,
                  boxShadow: s2State === 'processing' ? '0 10px 30px -5px rgba(34, 197, 94, 0.15)' : '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'all 0.35s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="card-badge font-mono" style={{ backgroundColor: s2State === 'waiting' ? '#f1f5f9' : 'var(--leaf-100)', color: s2State === 'waiting' ? '#64748b' : 'var(--forest-900)', fontSize: '0.72rem', fontWeight: '700' }}>
                    STAGE 2 OF 3
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: s2State === 'verified' ? '#15803d' : s2State === 'processing' ? 'var(--leaf-600)' : '#94a3b8' }}>
                    {s2State === 'verified' ? '✓ Stage 2 Verified' : s2State === 'processing' ? 'Processing...' : 'Waiting for Stage 1...'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--forest-950)', margin: '0 0 0.25rem 0' }}>
                  YIELD PREDICTION
                </h3>

                {/* Synchronized Text Step */}
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: s2State === 'verified' ? '#15803d' : s2State === 'processing' ? 'var(--leaf-700)' : '#94a3b8', minHeight: '24px', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  {s2State === 'processing' && (
                    <span className="pulsing-ping green" style={{ width: '7px', height: '7px' }} />
                  )}
                  <span>{s2State === 'verified' ? '✓ Stage 2 Verified' : s2State === 'waiting' ? 'Waiting for Stage 1 verification...' : STAGE_2_STEPS[s2TextIdx]}</span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <motion.div
                    animate={{ width: s2State === 'verified' ? '100%' : s2State === 'processing' ? `${Math.round(((s2TextIdx + 1) / STAGE_2_STEPS.length) * 100)}%` : '0%' }}
                    transition={{ duration: 0.4 }}
                    style={{ height: '100%', backgroundColor: s2State === 'verified' ? '#15803d' : 'var(--leaf-500)', borderRadius: '999px' }}
                  />
                </div>

                {/* Visual Flow Animation (Soil + Weather + Farm Parameters -> Yield Prediction -> Expected Yield) */}
                {s2State === 'processing' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', backgroundColor: 'var(--warm-50)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.725rem', color: 'var(--forest-900)', fontWeight: '600', marginBottom: '0.75rem' }}>
                    <span>🌱 Soil</span>
                    <span>+</span>
                    <span>🌤 Weather</span>
                    <span>+</span>
                    <span>⚙️ Farm Params</span>
                    <span>→</span>
                    <span style={{ color: 'var(--leaf-600)', fontWeight: '700' }}>🤖 Yield Model</span>
                    <span>→</span>
                    <span>🌾 Expected Yield</span>
                  </div>
                )}

                {/* Verified Actual Output Results */}
                {s2State === 'verified' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.675rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Expected Yield</span>
                      <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--forest-950)' }}>
                        {yieldVal != null ? `${yieldVal} tonnes / hectare` : 'Agronomic Model Estimate Ready'}
                      </div>
                    </div>
                    <span className="card-badge font-mono" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.72rem' }}>
                      Random Forest Regressor
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>


            {/* ════════ STAGE 3: YIELD RISK ASSESSMENT ════════ */}
            <div ref={card3Ref} style={{ display: 'flex', gap: '1.25rem', marginBottom: '2.25rem', opacity: s3State === 'waiting' ? 0.6 : 1, transition: 'opacity 0.4s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TimelineIcon state={s3State} />
              </div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                style={{
                  flex: 1, backgroundColor: '#ffffff', borderRadius: '20px', padding: '1.35rem 1.5rem',
                  border: `2px solid ${s3State === 'processing' ? 'var(--leaf-500)' : s3State === 'verified' ? '#bbf7d0' : 'var(--warm-200)'}`,
                  boxShadow: s3State === 'processing' ? '0 10px 30px -5px rgba(34, 197, 94, 0.15)' : '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'all 0.35s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="card-badge font-mono" style={{ backgroundColor: s3State === 'waiting' ? '#f1f5f9' : 'var(--leaf-100)', color: s3State === 'waiting' ? '#64748b' : 'var(--forest-900)', fontSize: '0.72rem', fontWeight: '700' }}>
                    STAGE 3 OF 3
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: s3State === 'verified' ? '#15803d' : s3State === 'processing' ? 'var(--leaf-600)' : '#94a3b8' }}>
                    {s3State === 'verified' ? '✓ Stage 3 Verified' : s3State === 'processing' ? 'Processing...' : 'Waiting for Stage 2...'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--forest-950)', margin: '0 0 0.25rem 0' }}>
                  YIELD RISK ASSESSMENT
                </h3>

                {/* Synchronized Text Step */}
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: s3State === 'verified' ? '#15803d' : s3State === 'processing' ? 'var(--leaf-700)' : '#94a3b8', minHeight: '24px', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  {s3State === 'processing' && (
                    <span className="pulsing-ping green" style={{ width: '7px', height: '7px' }} />
                  )}
                  <span>{s3State === 'verified' ? '✓ Stage 3 Verified' : s3State === 'waiting' ? 'Waiting for Stage 2 verification...' : STAGE_3_STEPS[s3TextIdx]}</span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '5px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <motion.div
                    animate={{ width: s3State === 'verified' ? '100%' : s3State === 'processing' ? `${Math.round(((s3TextIdx + 1) / STAGE_3_STEPS.length) * 100)}%` : '0%' }}
                    transition={{ duration: 0.4 }}
                    style={{ height: '100%', backgroundColor: s3State === 'verified' ? '#15803d' : 'var(--leaf-500)', borderRadius: '999px' }}
                  />
                </div>

                {/* Visual Flow (Disease Severity + Expected Yield -> Yield Risk Assessment -> Yield Risk + Recommendation) */}
                {s3State === 'processing' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', backgroundColor: 'var(--warm-50)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.725rem', color: 'var(--forest-900)', fontWeight: '600', marginBottom: '0.75rem' }}>
                    <span>⚡ Severity</span>
                    <span>+</span>
                    <span>🌾 Expected Yield</span>
                    <span>→</span>
                    <span style={{ color: 'var(--leaf-600)', fontWeight: '700' }}>🛡️ Risk Engine</span>
                    <span>→</span>
                    <span>📋 Yield Risk</span>
                  </div>
                )}

                {/* Verified Actual Output Results */}
                {s3State === 'verified' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '0.85rem 1rem', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.675rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>Yield Risk</span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '6px',
                          backgroundColor: overallRisk === 'High' ? '#fee2e2' : overallRisk === 'Medium' ? '#fef3c7' : '#dcfce7',
                          color: overallRisk === 'High' ? '#b91c1c' : overallRisk === 'Medium' ? '#b45309' : '#15803d',
                        }}
                      >
                        {overallRisk} Risk
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--forest-900)', lineHeight: '1.45' }}>
                      <strong>Recommendation:</strong> {recommendation}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* ════════ FINAL REVEAL CARD ════════ */}
            <AnimatePresence>
              {allVerified && (
                <motion.div
                  ref={reportRef}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE_SMOOTH }}
                  className="bg-white"
                  style={{
                    borderRadius: '24px', padding: '2rem', border: '2px solid #bbf7d0',
                    backgroundColor: '#f0fdf4', boxShadow: '0 20px 40px -10px rgba(34, 197, 94, 0.2)', textAlign: 'center',
                  }}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#15803d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    ✓
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--forest-950)', margin: '0 0 0.5rem 0' }}>
                    CropLens AI Analysis Complete
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--forest-800)', margin: '0 0 1.25rem 0' }}>
                    All three pipeline stages have been verified successfully.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#166534', fontWeight: '700' }}>
                    <span>✓ Stage 1 Verified</span>
                    <span>✓ Stage 2 Verified</span>
                    <span>✓ Stage 3 Verified</span>
                  </div>

                  <button
                    type="button"
                    className="btn-primary-hero btn-tap"
                    style={{ padding: '0.85rem 2.25rem', borderRadius: '12px', fontSize: '1rem', fontWeight: '700' }}
                    onClick={() => onNavigate && onNavigate('report')}
                  >
                    View Complete Diagnostic Report →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </div>
  );
}
