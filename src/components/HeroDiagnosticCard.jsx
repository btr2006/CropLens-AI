import React from 'react';
import leafSample from '../assets/leaf_sample_hero.jpg';

export default function HeroDiagnosticCard() {
  return (
    <div className="saas-preview-card interactive-lift">
      {/* Card Header */}
      <div className="saas-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="status-dot green pulse"></span>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--forest-950)' }}>
            Live Diagnostic Engine
          </span>
        </div>
        <span className="card-badge font-mono" style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.675rem' }}>
          Intel Arc Active • 58ms
        </span>
      </div>

      {/* Leaf Scanner Preview Frame */}
      <div className="saas-preview-leaf-frame">
        <img src={leafSample} alt="Tomato leaf sample" className="saas-preview-leaf-img" />
        <div className="saas-preview-scanner-line"></div>
        
        {/* Floating Confidence Tag */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          backgroundColor: 'rgba(5, 26, 15, 0.82)',
          backdropFilter: 'blur(6px)',
          color: '#ffffff',
          borderRadius: '6px',
          padding: '0.2rem 0.5rem',
          fontSize: '0.7rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--leaf-400)' }}></span>
          Target: Tomato (Solanum lycopersicum)
        </div>
      </div>

      {/* 4 Diagnostic Micro-Telemetry Cells */}
      <div className="saas-preview-grid">
        <div className="saas-preview-cell">
          <div className="saas-preview-cell-label">Disease Detection</div>
          <div className="saas-preview-cell-val" style={{ color: 'var(--forest-950)' }}>
            Early Blight <span style={{ fontSize: '0.75rem', color: 'var(--leaf-600)', fontWeight: '700' }}>(99.2%)</span>
          </div>
        </div>

        <div className="saas-preview-cell" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="saas-preview-cell-label" style={{ color: '#92400e' }}>Severity Level</div>
          <div className="saas-preview-cell-val" style={{ color: '#b45309' }}>
            Mild <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>(64.5%)</span>
          </div>
        </div>

        <div className="saas-preview-cell">
          <div className="saas-preview-cell-label">Expected Yield</div>
          <div className="saas-preview-cell-val" style={{ color: 'var(--forest-950)' }}>
            11.82 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>t/ha</span>
          </div>
        </div>

        <div className="saas-preview-cell" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="saas-preview-cell-label" style={{ color: '#92400e' }}>Synthesized Risk</div>
          <div className="saas-preview-cell-val" style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="status-dot amber"></span>
            Medium Risk
          </div>
        </div>
      </div>
    </div>
  );
}
