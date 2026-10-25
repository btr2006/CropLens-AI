import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Database,
  FileText,
  Cpu,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { RESEARCH_MAP_NODES, RESEARCH_WALKTHROUGH_STEPS } from '../data/researchData';

export default function ResearchDetailModal({
  selectedNodeId,
  isOpen,
  onClose,
  onSelectNode,
}) {
  if (!isOpen || !selectedNodeId) return null;

  const node = RESEARCH_MAP_NODES[selectedNodeId] || RESEARCH_MAP_NODES['node_disease'];

  const currentIdx = RESEARCH_WALKTHROUGH_STEPS.indexOf(node.id);
  const prevId = currentIdx > 0 ? RESEARCH_WALKTHROUGH_STEPS[currentIdx - 1] : null;
  const nextId =
    currentIdx >= 0 && currentIdx < RESEARCH_WALKTHROUGH_STEPS.length - 1
      ? RESEARCH_WALKTHROUGH_STEPS[currentIdx + 1]
      : null;

  return (
    <AnimatePresence>
      <div className="res-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <motion.div
          className="res-modal-card"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="res-modal-header">
            <div className="res-modal-header-left">
              <span className="res-modal-type-badge font-mono">{node.typeBadge}</span>
              <h3 className="res-modal-title">{node.title}</h3>
              <span className="res-modal-role font-mono">{node.type}</span>
            </div>

            <button
              type="button"
              className="res-modal-close-btn"
              onClick={onClose}
              aria-label="Close research details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="res-modal-body">
            {/* 1. Role in CropLens */}
            <div className="res-modal-block">
              <span className="res-block-label font-mono">ROLE IN CROPLENS</span>
              <p className="res-block-text">{node.roleInCropGuard}</p>
            </div>

            {/* 2. Source / Citation Link */}
            <div className="res-modal-block">
              <span className="res-block-label font-mono">PROVENANCE & SOURCE</span>
              <div className="res-source-row">
                <span className="res-source-name font-mono">{node.sourceName}</span>
                {node.sourceUrl && (
                  <a
                    href={node.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="res-source-link-btn"
                  >
                    <span>Open Verified Source ↗</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* 3. Our Use */}
            <div className="res-modal-block">
              <span className="res-block-label font-mono">OUR IMPLEMENTATION & USE</span>
              <p className="res-block-text">{node.ourUse}</p>
            </div>

            {/* 4. Our Result (Clearly separated as OUR EXPERIMENT) */}
            <div className="res-modal-block">
              <span className="res-block-label font-mono">OUR EXPERIMENTAL RESULT</span>
              <div className="res-result-box">
                <CheckCircle2 size={16} className="text-leaf" />
                <span className="res-result-text font-mono">{node.ourResult}</span>
              </div>
            </div>

            {/* 5. Limitation (Transparent & Rigorous) */}
            <div className="res-modal-block">
              <span className="res-block-label font-mono">KNOWN SYSTEM LIMITATION</span>
              <div className="res-limitation-box">
                <AlertTriangle size={16} className="lim-alert-icon" />
                <p className="lim-text">{node.limitation}</p>
              </div>
            </div>

            {/* 6. Connected Evidence Nodes */}
            {node.connectedNodeIds && node.connectedNodeIds.length > 0 && (
              <div className="res-modal-block">
                <span className="res-block-label font-mono">CONNECTED EVIDENCE CHAIN</span>
                <div className="res-connected-chips">
                  {node.connectedNodeIds.map((relId) => {
                    const relNode = RESEARCH_MAP_NODES[relId];
                    if (!relNode) return null;
                    return (
                      <button
                        key={relId}
                        type="button"
                        className="res-rel-chip"
                        onClick={() => onSelectNode(relId)}
                      >
                        <span className="rel-chip-badge font-mono">{relNode.type}</span>
                        <span className="rel-chip-name">{relNode.shortName || relNode.title}</span>
                        <ArrowRight size={12} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="res-modal-footer">
            <button
              type="button"
              className="res-modal-nav-btn"
              disabled={!prevId}
              onClick={() => prevId && onSelectNode(prevId)}
            >
              <ArrowLeft size={14} />
              <span>Previous Evidence</span>
            </button>

            <span className="res-step-counter font-mono">
              {currentIdx >= 0 ? `${currentIdx + 1} of ${RESEARCH_WALKTHROUGH_STEPS.length}` : 'Research Node'}
            </span>

            <button
              type="button"
              className="res-modal-nav-btn"
              disabled={!nextId}
              onClick={() => nextId && onSelectNode(nextId)}
            >
              <span>Next Evidence</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
