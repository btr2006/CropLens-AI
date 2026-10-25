import React from 'react';
import { motion } from 'framer-motion';
import HeroDiagnosticCard from '../components/HeroDiagnosticCard';
import Hero3DCanvas from '../components/Hero3DCanvas';
import TextReveal from '../components/TextReveal';
import AnimatedSection from '../components/AnimatedSection';
import StaggerGrid from '../components/StaggerGrid';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

export default function LandingView({ onNavigate }) {
  return (
    <div className="view-panel active animate-panel-in" id="view-landing">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="saas-hero-section">
        {/* Subtle Ambient Canvas */}
        <Hero3DCanvas />

        <div className="section-container saas-hero-grid">
          {/* Left Column: Product Value Prop */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="saas-hero-pill">
                <span className="pulsing-dot-wrapper">
                  <span className="pulsing-ping green"></span>
                  <span className="pulsing-dot green"></span>
                </span>
                Multi-Crop Agricultural Intelligence
              </div>
            </motion.div>

            <h1 className="saas-hero-title">
              <TextReveal
                text="Detect disease early."
                as="span"
                delay={0.15}
                duration={0.45}
              />
              <br />
              <span className="saas-hero-title-accent">
                <TextReveal
                  text="Protect your yield."
                  as="span"
                  delay={0.4}
                  duration={0.45}
                />
              </span>
            </h1>

            <TextReveal
              text="AI-powered crop health analysis combining computer vision, severity assessment, yield modeling and environmental context."
              as="p"
              className="saas-hero-subtext"
              delay={0.55}
              stagger={0.025}
            />

            <motion.div
              className="saas-hero-cta-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <InteractiveHoverButton
                text="Start Crop Scan"
                variant="primary"
                onClick={() => onNavigate('scan')}
              />

              <InteractiveHoverButton
                text="Explore Analysis"
                variant="secondary"
                onClick={() => onNavigate('pipeline')}
              />
            </motion.div>

            {/* Micro Stats Strip */}
            <motion.div
              className="saas-hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="saas-stat-item">
                <span className="saas-stat-num">38 Classes</span>
                <span className="saas-stat-label">Disease Vision Model</span>
              </div>
              <div className="saas-stat-item">
                <span className="saas-stat-num">14 Pairs</span>
                <span className="saas-stat-label">Conditioned Severity</span>
              </div>
              <div className="saas-stat-item">
                <span className="saas-stat-num">&lt; 70ms</span>
                <span className="saas-stat-label">Intel Arc Acceleration</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Live Interactive Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <HeroDiagnosticCard />
          </motion.div>
        </div>
      </section>

      {/* ================= 2. FEATURE GRID (4 PRIMARY CAPABILITIES) ================= */}
      <section className="saas-features-section">
        <div className="section-container">
          <AnimatedSection delay={0.05}>
            <div className="saas-section-header">
              <span className="saas-section-kicker">Core Capabilities</span>
              <TextReveal
                text="Built for Real Agronomic Insight"
                as="h2"
                className="saas-section-title"
                delay={0.1}
              />
              <TextReveal
                text="Transparent multi-signal pipeline providing actionable decision support."
                as="p"
                className="saas-section-desc"
                delay={0.25}
                stagger={0.03}
              />
            </div>
          </AnimatedSection>

          <StaggerGrid className="saas-features-grid" stagger={0.12} delay={0.15}>
            {/* Capability 1 */}
            <div className="saas-feature-card interactive-lift">
              <div className="saas-feature-icon-box">
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="saas-feature-title">Disease Detection</h3>
              <p className="saas-feature-desc">
                MobileNetV2 classifier identifying botanical pathologies across 38 crop categories.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="saas-feature-card interactive-lift">
              <div className="saas-feature-icon-box" style={{ color: '#d97706' }}>
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="saas-feature-title">Severity Assessment</h3>
              <p className="saas-feature-desc">
                Disease-conditioned neural network grading Mild vs Severe on verified training splits.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="saas-feature-card interactive-lift">
              <div className="saas-feature-icon-box">
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="saas-feature-title">Yield Prediction</h3>
              <p className="saas-feature-desc">
                Random forest regressor estimating yield potential (t/ha) from soil nutrients and climate.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="saas-feature-card interactive-lift">
              <div className="saas-feature-icon-box" style={{ color: '#051a0f' }}>
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="saas-feature-title">Risk Synthesis</h3>
              <p className="saas-feature-desc">
                Deterministic fusion engine synthesizing disease, severity, and yield into unified risk.
              </p>
            </div>
          </StaggerGrid>
        </div>
      </section>

      {/* ================= 3. HOW IT WORKS (4 STEPS) ================= */}
      <section className="saas-workflow-section">
        <div className="section-container">
          <AnimatedSection delay={0.05}>
            <div className="saas-section-header">
              <span className="saas-section-kicker">How It Works</span>
              <TextReveal
                text="From Leaf Capture to Action"
                as="h2"
                className="saas-section-title"
                delay={0.1}
              />
              <TextReveal
                text="Four streamlined steps from raw field image to synthesized advisory."
                as="p"
                className="saas-section-desc"
                delay={0.25}
                stagger={0.03}
              />
            </div>
          </AnimatedSection>

          <StaggerGrid className="saas-steps-grid" stagger={0.1} delay={0.1}>
            <div className="saas-step-card interactive-lift" onClick={() => onNavigate('scan')}>
              <span className="saas-step-num">01</span>
              <h3 className="saas-step-title">Upload</h3>
              <p className="saas-step-desc">
                Capture or upload a clear leaf image and input regional soil nutrient parameters.
              </p>
            </div>

            <div className="saas-step-card interactive-lift" onClick={() => onNavigate('scan')}>
              <span className="saas-step-num">02</span>
              <h3 className="saas-step-title">Analyze</h3>
              <p className="saas-step-desc">
                Stage 1 CNN identifies pathology; Stage 2 evaluates conditioned severity.
              </p>
            </div>

            <div className="saas-step-card interactive-lift" onClick={() => onNavigate('report')}>
              <span className="saas-step-num">03</span>
              <h3 className="saas-step-title">Understand</h3>
              <p className="saas-step-desc">
                View structured yield estimates, risk synthesis, and listen to AI explanations.
              </p>
            </div>

            <div className="saas-step-card interactive-lift" onClick={() => onNavigate('report')}>
              <span className="saas-step-num">04</span>
              <h3 className="saas-step-title">Act</h3>
              <p className="saas-step-desc">
                Apply actionable non-chemical farm management tips and consult specialists.
              </p>
            </div>
          </StaggerGrid>
        </div>
      </section>

      {/* ================= 4. FINAL CALL TO ACTION ================= */}
      <AnimatedSection variant="scaleUp" delay={0.1}>
        <section className="saas-cta-section">
          <div className="section-container" style={{ textAlign: 'center', maxWidth: '640px' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--forest-950)', letterSpacing: '-0.02em', marginBottom: '0.85rem' }}>
              Ready to analyze your crop health?
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              Experience instant multi-stage diagnostic intelligence with zero installation required.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <InteractiveHoverButton
                text="Start Free Crop Scan"
                variant="primary"
                onClick={() => onNavigate('scan')}
              />
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
