import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowDown,
  GitBranch,
  Network,
  Database,
  FileText,
  Cpu,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import ResearchNode from './ResearchNode';
import ResearchDetailModal from './ResearchDetailModal';
import {
  RESEARCH_MAP_NODES,
  RESEARCH_WALKTHROUGH_STEPS,
} from '../data/researchData';

export default function ResearchMap() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'disease', 'severity', 'yield', 'foundations'
  const timerRef = useRef(null);

  // Active node during walkthrough
  const activeWalkthroughNodeId = isPlaying
    ? RESEARCH_WALKTHROUGH_STEPS[walkthroughIndex]
    : null;

  // The active focus node is either the walkthrough node or the clicked/inspected node
  const activeFocusId = activeWalkthroughNodeId || selectedNodeId;

  // Play / Pause walkthrough
  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (walkthroughIndex >= RESEARCH_WALKTHROUGH_STEPS.length - 1) {
        setWalkthroughIndex(0);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setWalkthroughIndex(0);
  };

  // Walkthrough interval timer (3.2 seconds per node)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setWalkthroughIndex((prev) => {
          const next = prev + 1;
          if (next >= RESEARCH_WALKTHROUGH_STEPS.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 3200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Click on a node
  const handleSelectNode = (nodeId) => {
    setSelectedNodeId(nodeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Determine relationship state
  const isSelected = (nodeId) => selectedNodeId === nodeId;
  const isWalkthroughActive = (nodeId) => activeWalkthroughNodeId === nodeId;

  const isHighlightedRelation = (nodeId) => {
    if (!activeFocusId || activeFocusId === nodeId) return false;
    const focusNode = RESEARCH_MAP_NODES[activeFocusId];
    return focusNode?.connectedNodeIds?.includes(nodeId) || false;
  };

  const isDimmed = (nodeId) => {
    // If filter is active, dim nodes not matching category
    if (activeFilter !== 'all') {
      const node = RESEARCH_MAP_NODES[nodeId];
      if (activeFilter === 'foundations') {
        if (!['foundation', 'paper_mobilenet', 'node_mobilenet', 'node_rocole', 'paper_rocole'].includes(nodeId) && node?.category !== 'foundation') {
          return true;
        }
      } else if (node?.category !== activeFilter) {
        return true;
      }
    }

    if (!activeFocusId) return false;
    if (activeFocusId === nodeId) return false;
    const focusNode = RESEARCH_MAP_NODES[activeFocusId];
    return !focusNode?.connectedNodeIds?.includes(nodeId);
  };

  const currentActiveNode = activeFocusId ? RESEARCH_MAP_NODES[activeFocusId] : null;

  return (
    <div className="research-map-wrapper">
      {/* 1. Walkthrough & Exploration Control Bar */}
      <div className="res-map-toolbar">
        <div className="res-toolbar-left">
          <button
            type="button"
            className={`btn-res-play ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause Research Walkthrough' : 'Explore Research Map'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            <span>{isPlaying ? 'Pause Walkthrough' : '▶ Explore Research Map'}</span>
          </button>

          <button
            type="button"
            className="btn-res-reset"
            onClick={handleReset}
            title="Reset exploration to start"
            aria-label="Reset Walkthrough"
          >
            <RotateCcw size={14} />
          </button>

          <div className="res-walkthrough-status font-mono">
            <span className={`res-pulse-dot ${isPlaying ? 'pulsing' : ''}`} />
            <span>
              {isPlaying
                ? `[Research Map Walkthrough] Step ${walkthroughIndex + 1} of ${RESEARCH_WALKTHROUGH_STEPS.length}: ${
                    RESEARCH_MAP_NODES[RESEARCH_WALKTHROUGH_STEPS[walkthroughIndex]]?.title
                  }`
                : 'Interactive Research Map: Click any node to inspect evidence, datasets & citations'}
            </span>
          </div>
        </div>

        <div className="res-toolbar-right">
          {activeFocusId && (
            <button
              type="button"
              className="btn-res-inspect-now font-mono"
              onClick={() => handleSelectNode(activeFocusId)}
            >
              <span>Inspect {currentActiveNode?.shortName || 'Node'} ↗</span>
            </button>
          )}

          {/* Branch filter pills */}
          <div className="res-filter-group font-mono">
            <button
              type="button"
              className={`res-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Pillars
            </button>
            <button
              type="button"
              className={`res-filter-pill ${activeFilter === 'disease' ? 'active' : ''}`}
              onClick={() => setActiveFilter('disease')}
            >
              Disease
            </button>
            <button
              type="button"
              className={`res-filter-pill ${activeFilter === 'severity' ? 'active' : ''}`}
              onClick={() => setActiveFilter('severity')}
            >
              Severity
            </button>
            <button
              type="button"
              className={`res-filter-pill ${activeFilter === 'yield' ? 'active' : ''}`}
              onClick={() => setActiveFilter('yield')}
            >
              Yield
            </button>
            <button
              type="button"
              className={`res-filter-pill ${activeFilter === 'foundations' ? 'active' : ''}`}
              onClick={() => setActiveFilter('foundations')}
            >
              Foundations
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual Research Evidence Graph Canvas */}
      <div className="res-graph-canvas">
        {/* Apex Anchor: CropLens AI */}
        <div className="res-apex-container">
          <div className="res-apex-badge font-mono">
            <Network size={14} />
            <span>CROPLENS AI MULTI-SIGNAL RESEARCH PIPELINE</span>
          </div>
          <div className="res-apex-stem" />
          <div className="res-branch-fork-bar" />
        </div>

        {/* 3 Main Research Pillars Grid */}
        <div className="res-pillars-grid">
          {/* ========================================================
              PILLAR 1: DISEASE CLASSIFICATION
             ======================================================== */}
          <div className={`res-pillar-column pillar-disease ${activeFilter !== 'all' && activeFilter !== 'disease' ? 'dimmed-pillar' : ''}`}>
            <div className="res-pillar-header">
              <span className="res-pillar-tag font-mono">PILLAR 01</span>
              <h3 className="res-pillar-name">Disease Detection</h3>
              <span className="res-pillar-sub font-mono">38 Classes • MobileNetV2</span>
            </div>

            {/* Stage 1: Our Model */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_disease}
                isSelected={isSelected('node_disease')}
                isActiveWalkthrough={isWalkthroughActive('node_disease')}
                isHighlightedRelation={isHighlightedRelation('node_disease')}
                isDimmed={isDimmed('node_disease')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* Connecting Conduit */}
            <div className="res-conduit">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">Supervised On 87,867 Leaf Images ↓</span>
              <div className="conduit-line" />
            </div>

            {/* Stage 2: Dataset */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_plantvillage}
                isSelected={isSelected('node_plantvillage')}
                isActiveWalkthrough={isWalkthroughActive('node_plantvillage')}
                isHighlightedRelation={isHighlightedRelation('node_plantvillage')}
                isDimmed={isDimmed('node_plantvillage')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* Connecting Conduit */}
            <div className="res-conduit">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">Scientific Benchmark Baseline ↓</span>
              <div className="conduit-line" />
            </div>

            {/* Stage 3: Scientific Paper */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.paper_mohanty}
                isSelected={isSelected('paper_mohanty')}
                isActiveWalkthrough={isWalkthroughActive('paper_mohanty')}
                isHighlightedRelation={isHighlightedRelation('paper_mohanty')}
                isDimmed={isDimmed('paper_mohanty')}
                onSelect={handleSelectNode}
              />
            </div>
          </div>

          {/* ========================================================
              PILLAR 2: SEVERITY ASSESSMENT
             ======================================================== */}
          <div className={`res-pillar-column pillar-severity ${activeFilter !== 'all' && activeFilter !== 'severity' ? 'dimmed-pillar' : ''}`}>
            <div className="res-pillar-header">
              <span className="res-pillar-tag font-mono">PILLAR 02</span>
              <h3 className="res-pillar-name">Severity Assessment</h3>
              <span className="res-pillar-sub font-mono">Dual-Stage (Mild / Severe) • 14 Pairs</span>
            </div>

            {/* Stage 1: Our Model */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_severity}
                isSelected={isSelected('node_severity')}
                isActiveWalkthrough={isWalkthroughActive('node_severity')}
                isHighlightedRelation={isHighlightedRelation('node_severity')}
                isDimmed={isDimmed('node_severity')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* Connecting Conduit */}
            <div className="res-conduit">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">Trained On 37,721 Clean Images ↓</span>
              <div className="conduit-line" />
            </div>

            {/* Stage 2: Dataset */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_aichallenger}
                isSelected={isSelected('node_aichallenger')}
                isActiveWalkthrough={isWalkthroughActive('node_aichallenger')}
                isHighlightedRelation={isHighlightedRelation('node_aichallenger')}
                isDimmed={isDimmed('node_aichallenger')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* Connecting Conduit */}
            <div className="res-conduit">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">Peer-Reviewed Staging Methodology ↓</span>
              <div className="conduit-line" />
            </div>

            {/* Stage 3: Scientific Paper */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.paper_severity}
                isSelected={isSelected('paper_severity')}
                isActiveWalkthrough={isWalkthroughActive('paper_severity')}
                isHighlightedRelation={isHighlightedRelation('paper_severity')}
                isDimmed={isDimmed('paper_severity')}
                onSelect={handleSelectNode}
              />
            </div>
          </div>

          {/* ========================================================
              PILLAR 3: YIELD REGRESSION
             ======================================================== */}
          <div className={`res-pillar-column pillar-yield ${activeFilter !== 'all' && activeFilter !== 'yield' ? 'dimmed-pillar' : ''}`}>
            <div className="res-pillar-header">
              <span className="res-pillar-tag font-mono">PILLAR 03</span>
              <h3 className="res-pillar-name">Yield Prediction</h3>
              <span className="res-pillar-sub font-mono">Soil Chemistry & Temperature</span>
            </div>

            {/* Stage 1: Our Model */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_yield}
                isSelected={isSelected('node_yield')}
                isActiveWalkthrough={isWalkthroughActive('node_yield')}
                isHighlightedRelation={isHighlightedRelation('node_yield')}
                isDimmed={isDimmed('node_yield')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* Connecting Conduit */}
            <div className="res-conduit">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">2,596 Observation Records ↓</span>
              <div className="conduit-line" />
            </div>

            {/* Stage 2: Dataset */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_yield_dataset}
                isSelected={isSelected('node_yield_dataset')}
                isActiveWalkthrough={isWalkthroughActive('node_yield_dataset')}
                isHighlightedRelation={isHighlightedRelation('node_yield_dataset')}
                isDimmed={isDimmed('node_yield_dataset')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* Connecting Conduit */}
            <div className="res-conduit">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">Algorithmic Reference (100 Trees) ↓</span>
              <div className="conduit-line" />
            </div>

            {/* Stage 3: Scientific Paper */}
            <div className="res-node-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.paper_breiman}
                isSelected={isSelected('paper_breiman')}
                isActiveWalkthrough={isWalkthroughActive('paper_breiman')}
                isHighlightedRelation={isHighlightedRelation('paper_breiman')}
                isDimmed={isDimmed('paper_breiman')}
                onSelect={handleSelectNode}
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            FOUNDATION & EXPLORATORY RESEARCH STRIP
           ======================================================== */}
        <div className="res-foundations-row">
          <div className="res-foundations-header">
            <span className="foundations-badge font-mono">ARCHITECTURAL FOUNDATIONS & EXPERIMENTAL PRECEDENTS</span>
            <span className="foundations-sub font-mono">Cross-Cutting References Supporting Vision Pipeline</span>
          </div>

          <div className="res-foundations-grid">
            {/* MobileNetV2 Backbone */}
            <div className="res-foundation-card">
              <div className="foundation-card-top">
                <span className="foundation-tag font-mono">VISION BACKBONE</span>
                <span className="foundation-note font-mono">Sub-60ms Edge Inference</span>
              </div>
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_mobilenet}
                isSelected={isSelected('node_mobilenet')}
                isActiveWalkthrough={isWalkthroughActive('node_mobilenet')}
                isHighlightedRelation={isHighlightedRelation('node_mobilenet')}
                isDimmed={isDimmed('node_mobilenet')}
                onSelect={handleSelectNode}
              />
              <div className="foundation-paper-link-row">
                <ResearchNode
                  node={RESEARCH_MAP_NODES.paper_mobilenet}
                  isSelected={isSelected('paper_mobilenet')}
                  isActiveWalkthrough={isWalkthroughActive('paper_mobilenet')}
                  isHighlightedRelation={isHighlightedRelation('paper_mobilenet')}
                  isDimmed={isDimmed('paper_mobilenet')}
                  onSelect={handleSelectNode}
                />
              </div>
            </div>

            {/* RoCoLe Exploratory Precedent */}
            <div className="res-foundation-card exploratory">
              <div className="foundation-card-top">
                <span className="foundation-tag exploratory font-mono">PREVIOUS EXPERIMENT</span>
                <span className="foundation-note font-mono">Single-Crop Coffee Rust Precedent</span>
              </div>
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_rocole}
                isSelected={isSelected('node_rocole')}
                isActiveWalkthrough={isWalkthroughActive('node_rocole')}
                isHighlightedRelation={isHighlightedRelation('node_rocole')}
                isDimmed={isDimmed('node_rocole')}
                onSelect={handleSelectNode}
              />
              <div className="foundation-paper-link-row">
                <ResearchNode
                  node={RESEARCH_MAP_NODES.paper_rocole}
                  isSelected={isSelected('paper_rocole')}
                  isActiveWalkthrough={isWalkthroughActive('paper_rocole')}
                  isHighlightedRelation={isHighlightedRelation('paper_rocole')}
                  isDimmed={isDimmed('paper_rocole')}
                  onSelect={handleSelectNode}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            CONVERGENCE: MULTI-SIGNAL RISK FUSION & AI EXPLAINER
           ======================================================== */}
        <div className="res-convergence-section">
          {/* Convergence Funnel Graphic */}
          <div className="res-funnel-conduit">
            <div className="funnel-forks">
              <span className="fork-arm" />
              <span className="fork-arm" />
              <span className="fork-arm" />
            </div>
            <span className="funnel-label font-mono">Multi-Signal Deterministic Synthesis ↓</span>
            <div className="funnel-stem" />
          </div>

          <div className="res-convergence-grid">
            {/* Risk Fusion Node */}
            <div className="res-convergence-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_risk}
                isSelected={isSelected('node_risk')}
                isActiveWalkthrough={isWalkthroughActive('node_risk')}
                isHighlightedRelation={isHighlightedRelation('node_risk')}
                isDimmed={isDimmed('node_risk')}
                onSelect={handleSelectNode}
              />
            </div>

            {/* AI Assistant Node */}
            <div className="res-conduit vertical-short">
              <div className="conduit-line" />
              <span className="conduit-label font-mono">Grounded Farmer Advisory Generation ↓</span>
              <div className="conduit-line" />
            </div>

            <div className="res-convergence-slot">
              <ResearchNode
                node={RESEARCH_MAP_NODES.node_ai}
                isSelected={isSelected('node_ai')}
                isActiveWalkthrough={isWalkthroughActive('node_ai')}
                isHighlightedRelation={isHighlightedRelation('node_ai')}
                isDimmed={isDimmed('node_ai')}
                onSelect={handleSelectNode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detail Inspection Modal */}
      <ResearchDetailModal
        selectedNodeId={selectedNodeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectNode={(nodeId) => {
          setSelectedNodeId(nodeId);
        }}
      />
    </div>
  );
}
