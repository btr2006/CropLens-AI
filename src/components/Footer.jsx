import React from 'react';
import { motion } from 'framer-motion';

export default function Footer({ onNavigate }) {
  return (
    <footer className="saas-footer">
      <div className="section-container">
        <div className="saas-footer-grid">
          {/* Column 1: Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div className="saas-brand-icon" style={{ width: '28px', height: '28px', borderRadius: '7px' }}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-2.21 0-4 1.79-4 4 0 2.21 2.5 5 4 6 1.5-1 4-3.79 4-6 0-2.21-1.79-4-4-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="saas-footer-brand-title">CropLens AI</span>
            </div>
            <p className="saas-footer-brand-desc">
              AI-assisted multi-crop diagnostic intelligence and yield-risk decision support for modern sustainable agriculture.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <div className="saas-footer-col-title">Product</div>
            <button onClick={() => onNavigate('scan')} className="saas-footer-link">Crop Scan</button>
            <button onClick={() => onNavigate('pipeline')} className="saas-footer-link">Real-Time Pipeline</button>
            <button onClick={() => onNavigate('scan')} className="saas-footer-link">Severity Assessment</button>
            <button onClick={() => onNavigate('report')} className="saas-footer-link">Crop Health Report</button>
          </div>

          {/* Column 3: Research */}
          <div>
            <div className="saas-footer-col-title">Research</div>
            <button onClick={() => onNavigate('research')} className="saas-footer-link">Clean Split Methodology</button>
            <button onClick={() => onNavigate('research')} className="saas-footer-link">Intel Arc Benchmarks</button>
            <button onClick={() => onNavigate('research')} className="saas-footer-link">Plant Pathology Datasets</button>
            <button onClick={() => onNavigate('research')} className="saas-footer-link">Academic IDP Documentation</button>
          </div>

          {/* Column 4: Technology */}
          <div>
            <div className="saas-footer-col-title">Technology</div>
            <span className="saas-footer-link" style={{ cursor: 'default' }}>MobileNetV2 Vision CNN</span>
            <span className="saas-footer-link" style={{ cursor: 'default' }}>Disease-Conditioned Head</span>
            <span className="saas-footer-link" style={{ cursor: 'default' }}>Random Forest Yield Model</span>
            <span className="saas-footer-link" style={{ cursor: 'default' }}>Gemini LLM Assistant</span>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="saas-footer-bottom">
          <span>© 2026 CropLens AI. Functionally verified prototype for agronomic decision support.</span>
          <span style={{ maxWidth: '420px', textAlign: 'right' }}>
            Disclaimer: AI-generated agricultural guidance is advisory and does not replace in-person professional agronomic assessment.
          </span>
        </div>
      </div>
    </footer>
  );
}
