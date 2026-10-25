import React from 'react';

export default function FlowBanner({ currentView, onNavigate }) {
  const steps = [
    { id: 'landing', label: '1. Home' },
    { id: 'scan', label: '2. Crop Scan' },
    { id: 'processing', label: '3. Processing' },
    { id: 'report', label: '4. Crop Health Report' },
    { id: 'assistant', label: '5. AI Assistant' },
  ];

  return (
    <aside className="flow-banner" aria-label="Interactive Prototype Journey">
      <div className="flow-container">
        <div className="flow-status">
          <span className="pulsing-dot-wrapper">
            <span className="pulsing-ping"></span>
            <span className="pulsing-dot"></span>
          </span>
          <span className="flow-title">Interactive Prototype Journey:</span>
        </div>

        <nav className="flow-steps font-mono" aria-label="Journey steps">
          {steps.map((step, idx) => {
            const isActive = currentView === step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  className={`flow-step-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(step.id)}
                >
                  {step.label}
                </button>
                {idx < steps.length - 1 && (
                  <span className="flow-arrow">→</span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
