import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Database,
  Layers,
  Cpu,
  CheckCircle2,
  Code,
} from 'lucide-react';
import { ARCHITECTURE_NODES, WALKTHROUGH_STAGES } from '../data/architectureData';

export default function ArchitectureDetailModal({
  selectedNodeId,
  isOpen,
  onClose,
  onSelectNode,
}) {
  if (!isOpen || !selectedNodeId) return null;

  const node = ARCHITECTURE_NODES[selectedNodeId] || ARCHITECTURE_NODES['disease_classifier'];

  // Current stage in walkthrough
  const currentStageIndex = WALKTHROUGH_STAGES.indexOf(node.id);
  const prevStageId = currentStageIndex > 0 ? WALKTHROUGH_STAGES[currentStageIndex - 1] : null;
  const nextStageId =
    currentStageIndex >= 0 && currentStageIndex < WALKTHROUGH_STAGES.length - 1
      ? WALKTHROUGH_STAGES[currentStageIndex + 1]
      : null;

  return (
    <AnimatePresence>
      <div className="arch-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <motion.div
          className="arch-modal-card"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="arch-modal-header">
            <div className="arch-modal-header-info">
              <span className="arch-modal-stage font-mono">
                {node.stageNumber ? `STAGE 0${node.stageNumber} OF 09` : node.groupName}
              </span>
              <h3 className="arch-modal-title">{node.title}</h3>
              <div className="arch-modal-badges">
                <span className="arch-modal-badge tech">{node.badge}</span>
                <span className="arch-modal-badge group">{node.groupName}</span>
              </div>
            </div>

            <button
              type="button"
              className="arch-modal-close-btn"
              onClick={onClose}
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="arch-modal-body">
            {/* Purpose */}
            <div className="arch-modal-section">
              <h5 className="arch-modal-section-title">WHAT THIS COMPONENT DOES</h5>
              <p className="arch-modal-text">{node.purpose}</p>
            </div>

            {/* Inputs & Outputs (Concise Two-Column) */}
            <div className="arch-modal-io-grid">
              <div className="arch-modal-io-box">
                <span className="io-box-tag input">INPUT</span>
                <ul className="io-box-list">
                  {node.inputs.map((inp, idx) => (
                    <li key={idx}>
                      <strong>{inp.name}</strong> <span className="font-mono text-muted">({inp.type})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="arch-modal-io-box">
                <span className="io-box-tag output">OUTPUT</span>
                <ul className="io-box-list">
                  {node.outputs.map((out, idx) => (
                    <li key={idx}>
                      <strong>{out.name}</strong> <span className="font-mono text-muted">({out.type})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Dataset / Training Provenance */}
            {node.dataset && (
              <div className="arch-modal-section">
                <h5 className="arch-modal-section-title">DATASET & SOURCE</h5>
                <div className="arch-modal-dataset">
                  <Database size={15} className="text-leaf" />
                  <span>{node.dataset}</span>
                </div>
              </div>
            )}

            {/* Crucial Limitation (Transparent & Rigorous) */}
            {node.limitation && (
              <div className="arch-modal-limitation">
                <AlertTriangle size={17} className="limitation-alert-icon" />
                <div>
                  <strong>Important Constraint:</strong> {node.limitation}
                </div>
              </div>
            )}

            {/* Quick Live Sample Data */}
            {node.sampleData && (
              <div className="arch-modal-section">
                <h5 className="arch-modal-section-title">DATA FLOW SNIPPET</h5>
                <div className="arch-modal-code">
                  <pre className="font-mono">
                    <code>{JSON.stringify(node.sampleData, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls (Previous / Next) */}
          <div className="arch-modal-footer">
            <button
              type="button"
              className="arch-modal-nav-btn"
              disabled={!prevStageId}
              onClick={() => prevStageId && onSelectNode(prevStageId)}
            >
              <ArrowLeft size={15} />
              <span>Previous Stage</span>
            </button>

            <span className="font-mono arch-modal-step-counter">
              {currentStageIndex >= 0 ? `Stage ${currentStageIndex + 1} of 9` : 'Input Source'}
            </span>

            <button
              type="button"
              className="arch-modal-nav-btn"
              disabled={!nextStageId}
              onClick={() => nextStageId && onSelectNode(nextStageId)}
            >
              <span>Next Stage</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
