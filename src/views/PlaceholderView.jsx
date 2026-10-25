import React from 'react';

export default function PlaceholderView({ viewName, onNavigate }) {
  const titles = {
    scan: 'Crop Scan & Diagnostic Input',
    processing: 'Model Inference & Severity Analysis',
    report: 'Unified Crop Health Report',
    assistant: 'Multilingual Agronomic AI Assistant',
    pipeline: 'How It Works (System Architecture)',
    research: 'Research & Model Benchmarks',
    about: 'About CropLens AI Project',
  };

  const descriptions = {
    scan: 'Image Upload + Farm/Soil/Weather input interface scheduled for Stage 2.',
    processing: 'Real-time multi-stage inference visualization (lesion segmentation, regression yield prediction).',
    report: 'Interactive crop health report card with severity breakdown, yield risks, and agronomic guidance.',
    assistant: 'Multilingual conversational AI support with voice simulation (English, Telugu, Hindi).',
    pipeline: 'End-to-end technical pipeline overview explaining computer vision and tabular regression.',
    research: 'Academic methodology, dataset citations, model evaluation metrics, and system limitations.',
    about: 'College IDP Project: AI-Based Multi-Crop Disease Severity and Yield-Risk Prediction System.',
  };

  return (
    <div className="view-panel active animate-panel-in" id={`view-${viewName}`}>
      <div className="section-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="hero-pill-badge" style={{ margin: '0 auto 16px' }}>
          College IDP Pipeline • Next Stage
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          {titles[viewName] || 'CropLens AI Module'}
        </h1>
        <p className="hero-description" style={{ margin: '0 auto 32px' }}>
          {descriptions[viewName] || 'This view is configured as part of the safe staged roadmap.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-primary-hero btn-tap"
            onClick={() => onNavigate('landing')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
