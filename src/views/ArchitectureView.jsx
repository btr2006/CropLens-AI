import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  Layers,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import ArchitectureFlow from '../components/ArchitectureFlow';
import { ARCHITECTURE_NOTES } from '../data/architectureData';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';

export default function ArchitectureView({ onNavigate }) {
  const [expandedFaq, setExpandedFaq] = useState(0);

  return (
    <div className="view-panel active animate-panel-in arch-view-root" id="view-pipeline">
      {/* 1. Header */}
      <section className="arch-hero-section">
        <div className="section-container">
          <div className="arch-hero-content">
            <div className="arch-hero-pill">
              <Cpu size={14} className="pill-icon" />
              <span>SYSTEM ARCHITECTURE • TECHNICAL OVERVIEW</span>
            </div>

            <h1 className="arch-hero-title">How It Works</h1>

            <p className="arch-hero-subheading">
              See how CropLens transforms a leaf image and farm parameters into an AI-assisted crop-health report.
            </p>

            <div className="arch-hero-badges">
              <span className="arch-tag-item">
                <span className="dot neural" /> MobileNetV2 (38 Classes)
              </span>
              <span className="arch-tag-item">
                <span className="dot severity" /> Conditioned Severity (14 Pairs)
              </span>
              <span className="arch-tag-item">
                <span className="dot tabular" /> Random Forest (Yield Model)
              </span>
              <span className="arch-tag-item">
                <span className="dot rule" /> Deterministic Risk Fusion
              </span>
              <span className="arch-tag-item">
                <span className="dot api" /> Open-Meteo Weather (Non-ML)
              </span>
              <span className="arch-tag-item">
                <span className="dot llm" /> Gemini 3.8 Flash (Explainer)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Flow Pipeline */}
      <section className="arch-main-canvas-section">
        <div className="section-container">
          <ArchitectureFlow />
        </div>
      </section>

      {/* 3. Concise Academic & Evaluation Q&A */}
      <section className="arch-faq-section">
        <div className="section-container">
          <div className="arch-faq-header">
            <span className="notes-badge">
              <BookOpen size={14} style={{ marginRight: '6px' }} />
              COLLEGE IDP & VIVA REVIEW
            </span>
            <h2 className="faq-title">Architecture Key Design Decisions</h2>
            <p className="faq-desc">
              Concise explanations of model choices and technical constraints for evaluation.
            </p>
          </div>

          <div className="arch-faq-grid">
            {ARCHITECTURE_NOTES.map((note, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className={`arch-faq-card ${isOpen ? 'open' : ''}`}
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                >
                  <div className="faq-card-top">
                    <span className="faq-num font-mono">0{idx + 1}</span>
                    <h3 className="faq-question">{note.summary}</h3>
                    <ChevronDown
                      size={18}
                      className={`faq-chevron ${isOpen ? 'rotated' : ''}`}
                    />
                  </div>
                  {isOpen && (
                    <motion.div
                      className="faq-answer-block"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="faq-badge">{note.badge}</span>
                      <p className="faq-text">{note.description}</p>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="arch-cta-section">
        <div className="section-container">
          <div className="arch-cta-card">
            <div className="arch-cta-content">
              <span className="arch-cta-badge">EXPERIENCE THE PIPELINE LIVE</span>
              <h2 className="arch-cta-title">Ready to run a real crop diagnostic?</h2>
              <p className="arch-cta-desc">
                Upload a suspect leaf photograph and enter soil parameters to watch this multi-stage inference pipeline execute live with real ML predictions.
              </p>
              <div className="arch-cta-buttons">
                <InteractiveHoverButton
                  text="Start Free Crop Scan"
                  onClick={() => onNavigate('scan')}
                />
                <button
                  type="button"
                  className="arch-cta-secondary-btn"
                  onClick={() => onNavigate('landing')}
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
