import React from 'react';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

export default function Navbar({ currentView, onNavigate }) {
  return (
    <header className="saas-header">
      <div className="saas-header-container">
        {/* Brand Logo */}
        <button
          className="saas-brand"
          onClick={() => onNavigate('landing')}
          aria-label="CropLens AI Home"
        >
          <div className="saas-brand-icon">
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8c-2.21 0-4 1.79-4 4 0 2.21 2.5 5 4 6 1.5-1 4-3.79 4-6 0-2.21-1.79-4-4-4z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="saas-brand-name">
            CropLens <span className="saas-brand-tag">AI</span>
          </span>
        </button>

        {/* Center Navigation Pill */}
        <nav className="saas-nav-links">
          <button
            className={`saas-nav-item ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => onNavigate('landing')}
          >
            Home
          </button>
          <button
            className={`saas-nav-item ${currentView === 'scan' ? 'active' : ''}`}
            onClick={() => onNavigate('scan')}
          >
            Crop Scan
          </button>
          <button
            className={`saas-nav-item ${currentView === 'pipeline' ? 'active' : ''}`}
            onClick={() => onNavigate('pipeline')}
          >
            How It Works
          </button>
          <button
            className={`saas-nav-item ${currentView === 'research' ? 'active' : ''}`}
            onClick={() => onNavigate('research')}
          >
            Research
          </button>
          <button
            className={`saas-nav-item ${currentView === 'about' ? 'active' : ''}`}
            onClick={() => onNavigate('about')}
          >
            About
          </button>
        </nav>

        {/* Primary Header CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <InteractiveHoverButton
            text="Start Crop Scan"
            className="ihb-sm"
            onClick={() => onNavigate('scan')}
          />
        </div>
      </div>
    </header>
  );
}

