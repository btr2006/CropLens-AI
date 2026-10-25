import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Cpu,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Code,
  Layers,
  Info,
} from 'lucide-react';
import { ARCHITECTURE_NODES, WALKTHROUGH_STAGES } from '../data/architectureData';

export default function ArchitectureDetailPanel({
  selectedNodeId,
  onSelectNode,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'io' | 'payload'
  const node = ARCHITECTURE_NODES[selectedNodeId] || ARCHITECTURE_NODES['disease_classifier'];

  // Current stage index in the walkthrough sequence
  const currentStageIndex = WALKTHROUGH_STAGES.indexOf(node.id);
  const prevStageId = currentStageIndex > 0 ? WALKTHROUGH_STAGES[currentStageIndex - 1] : null;
  const nextStageId =
    currentStageIndex >= 0 && currentStageIndex < WALKTHROUGH_STAGES.length - 1
      ? WALKTHROUGH_STAGES[currentStageIndex + 1]
      : null;

  return (
    <motion.aside
      className="arch-detail-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Component Technical Details"
    >
      {/* Panel Header */}
      <div className="arch-panel-header">
        <div className="arch-panel-header-left">
          <span className="arch-panel-stage-badge">
            {node.stageNumber ? `STAGE 0${node.stageNumber} OF 09` : `INPUT STREAM`}
          </span>
          <h3 className="arch-panel-title">{node.title}</h3>
          <div className="arch-panel-tech-meta">
            <span className="arch-panel-badge">{node.badge}</span>
            <span className="arch-panel-group-badge">{node.groupName}</span>
          </div>
        </div>

        <div className="arch-panel-header-right">
          {onClose && (
            <button
              type="button"
              className="arch-panel-close-btn"
              onClick={onClose}
              aria-label="Close component details"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Panel Navigation Tabs */}
      <div className="arch-panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`arch-panel-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Info size={14} style={{ marginRight: '6px' }} />
          Architecture & Purpose
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'io'}
          className={`arch-panel-tab ${activeTab === 'io' ? 'active' : ''}`}
          onClick={() => setActiveTab('io')}
        >
          <Layers size={14} style={{ marginRight: '6px' }} />
          Inputs & Outputs ({node.inputs.length + node.outputs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'payload'}
          className={`arch-panel-tab ${activeTab === 'payload' ? 'active' : ''}`}
          onClick={() => setActiveTab('payload')}
        >
          <Code size={14} style={{ marginRight: '6px' }} />
          Live Data Schema
        </button>
      </div>

      {/* Panel Body Content */}
      <div className="arch-panel-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="arch-tab-pane"
            >
              {/* Primary Purpose */}
              <div className="arch-info-block">
                <span className="arch-info-label">PURPOSE & OBJECTIVE</span>
                <p className="arch-info-text">{node.purpose}</p>
              </div>

              {/* Technical Specifications Grid */}
              {node.details && (
                <div className="arch-info-block">
                  <span className="arch-info-label">TECHNICAL SPECIFICATIONS</span>
                  <div className="arch-specs-grid">
                    {Object.entries(node.details).map(([key, val]) => (
                      <div key={key} className="arch-spec-item">
                        <span className="spec-key">{key}</span>
                        <span className="spec-val font-mono">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dataset & Provenance */}
              <div className="arch-info-block">
                <span className="arch-info-label">DATASET / TRAINING SOURCE</span>
                <div className="arch-dataset-card">
                  <Database size={16} className="dataset-icon" />
                  <p className="dataset-text">{node.dataset}</p>
                </div>
              </div>

              {/* Rigorous Limitation Alert */}
              <div className="arch-info-block">
                <span className="arch-info-label">IMPORTANT TECHNICAL LIMITATION</span>
                <div className="arch-limitation-alert">
                  <AlertTriangle size={16} className="limitation-icon" />
                  <div className="limitation-content">
                    <strong>Critical Constraint:</strong> {node.limitation}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'io' && (
            <motion.div
              key="tab-io"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="arch-tab-pane"
            >
              {/* Inputs */}
              <div className="arch-io-section">
                <div className="io-section-heading">
                  <span className="io-pill-badge input">INPUT STREAM</span>
                  <span className="io-count">{node.inputs.length} fields</span>
                </div>
                <div className="io-items-list">
                  {node.inputs.map((inp, idx) => (
                    <div key={idx} className="io-card">
                      <div className="io-card-header">
                        <span className="io-name">{inp.name}</span>
                        <span className="io-type font-mono">{inp.type}</span>
                      </div>
                      <p className="io-desc">{inp.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div className="arch-io-section" style={{ marginTop: '1.25rem' }}>
                <div className="io-section-heading">
                  <span className="io-pill-badge output">OUTPUT STREAM</span>
                  <span className="io-count">{node.outputs.length} fields</span>
                </div>
                <div className="io-items-list">
                  {node.outputs.map((out, idx) => (
                    <div key={idx} className="io-card">
                      <div className="io-card-header">
                        <span className="io-name">{out.name}</span>
                        <span className="io-type font-mono">{out.type}</span>
                      </div>
                      <p className="io-desc">{out.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'payload' && (
            <motion.div
              key="tab-payload"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="arch-tab-pane"
            >
              <div className="arch-payload-header">
                <span className="arch-info-label">TYPICAL INFERENCE JSON PAYLOAD</span>
                <span className="font-mono payload-badge">application/json</span>
              </div>
              <div className="arch-json-viewer">
                <pre className="font-mono">
                  <code>{JSON.stringify(node.sampleData, null, 2)}</code>
                </pre>
              </div>
              <p className="arch-payload-hint">
                This schema reflects actual live payloads passed across FastAPI SSE streaming events and React state.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Stage Step Controller */}
      <div className="arch-panel-footer">
        <div className="arch-step-buttons">
          <button
            type="button"
            className="arch-step-btn prev"
            disabled={!prevStageId}
            onClick={() => prevStageId && onSelectNode(prevStageId)}
          >
            <ArrowLeft size={14} />
            <span>Previous Stage</span>
          </button>

          <span className="arch-step-indicator font-mono">
            {currentStageIndex >= 0 ? `${currentStageIndex + 1} / ${WALKTHROUGH_STAGES.length}` : 'Input Stream'}
          </span>

          <button
            type="button"
            className="arch-step-btn next"
            disabled={!nextStageId}
            onClick={() => nextStageId && onSelectNode(nextStageId)}
          >
            <span>Next Stage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
