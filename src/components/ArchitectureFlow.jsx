import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  Camera,
  CloudSun,
  Layers,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import ArchitectureNode from './ArchitectureNode';
import ArchitectureConnector from './ArchitectureConnector';
import ArchitectureDetailModal from './ArchitectureDetailModal';
import {
  ARCHITECTURE_NODES,
  WALKTHROUGH_STAGES,
} from '../data/architectureData';

export default function ArchitectureFlow() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);
  const timerRef = useRef(null);

  // Active node highlighted during walkthrough
  const activeWalkthroughNodeId = isPlaying ? WALKTHROUGH_STAGES[walkthroughIndex] : null;

  // Toggle Play / Pause Walkthrough
  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // If at end, start over
      if (walkthroughIndex >= WALKTHROUGH_STAGES.length - 1) {
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

  // Walkthrough timer effect (3s per stage)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setWalkthroughIndex((prev) => {
          const next = prev + 1;
          if (next >= WALKTHROUGH_STAGES.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 3000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Open modal when user clicks a node
  const handleSelectNode = (nodeId) => {
    setSelectedNodeId(nodeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Check if a node is dimmed during walkthrough
  const isDimmed = (nodeId) => {
    if (isPlaying && activeWalkthroughNodeId) {
      return activeWalkthroughNodeId !== nodeId;
    }
    return false;
  };

  const isHighlighted = (nodeId) => {
    if (isPlaying) {
      return activeWalkthroughNodeId === nodeId;
    }
    return selectedNodeId === nodeId;
  };

  return (
    <div className="arch-flow-clean">
      {/* 1. Walkthrough & Quick Controls Bar */}
      <div className="arch-clean-toolbar">
        <div className="toolbar-clean-left">
          <button
            type="button"
            className={`btn-walkthrough-play ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            <span>{isPlaying ? 'Pause Walkthrough' : 'Play Pipeline Walkthrough'}</span>
          </button>

          <button
            type="button"
            className="btn-walkthrough-reset"
            onClick={handleReset}
            title="Reset walkthrough"
            aria-label="Reset Walkthrough"
          >
            <RotateCcw size={14} />
          </button>

          <div className="walkthrough-live-pill font-mono">
            <span className={`live-dot ${isPlaying ? 'pulsing' : ''}`} />
            <span>
              {isPlaying
                ? `Running Step ${walkthroughIndex + 1} of 9: ${
                    ARCHITECTURE_NODES[WALKTHROUGH_STAGES[walkthroughIndex]]?.title
                  }`
                : 'Click any stage card to inspect exact model, dataset & limitations'}
            </span>
          </div>
        </div>

        {isPlaying && (
          <button
            type="button"
            className="btn-inspect-active font-mono"
            onClick={() => handleSelectNode(WALKTHROUGH_STAGES[walkthroughIndex])}
          >
            Inspect Current Stage ↗
          </button>
        )}
      </div>

      {/* 2. Visual Pipeline Flow Container */}
      <div className="arch-clean-pipeline">
        {/* SECTION 01: MULTI-STREAM INGESTION (Clear Data Isolation) */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">01</span>
            <span className="layer-clean-title">DATA INGESTION (ISOLATED STREAMS)</span>
          </div>

          <div className="arch-clean-inputs-grid">
            <ArchitectureNode
              node={ARCHITECTURE_NODES.leaf_input}
              isSelected={isHighlighted('leaf_input')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'leaf_input'}
              isDimmed={isDimmed('leaf_input')}
              onSelect={handleSelectNode}
            />
            <ArchitectureNode
              node={ARCHITECTURE_NODES.soil_input}
              isSelected={isHighlighted('soil_input')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'soil_input'}
              isDimmed={isDimmed('soil_input')}
              onSelect={handleSelectNode}
            />
            <ArchitectureNode
              node={ARCHITECTURE_NODES.geo_input}
              isSelected={isHighlighted('geo_input')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'geo_input'}
              isDimmed={isDimmed('geo_input')}
              onSelect={handleSelectNode}
            />
          </div>
        </div>

        {/* Directional Connector Down */}
        <div className="flow-connect-block">
          <ArchitectureConnector
            direction="down"
            length={32}
            label="Leaf Stream → Vision • Soil Stream → Yield • Geo → Weather"
            isHighlighted={isPlaying}
          />
        </div>

        {/* SECTION 02: COMPUTER VISION (Validation & MobileNetV2) */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">02</span>
            <span className="layer-clean-title">COMPUTER VISION INFERENCE</span>
          </div>

          <div className="arch-clean-stack">
            <ArchitectureNode
              node={ARCHITECTURE_NODES.image_validation}
              isSelected={isHighlighted('image_validation')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'image_validation'}
              isDimmed={isDimmed('image_validation')}
              onSelect={handleSelectNode}
            />

            <div className="inner-connect-down">
              <ArchitectureConnector
                direction="down"
                length={28}
                label="Tensor[1, 3, 224, 224]"
                isHighlighted={activeWalkthroughNodeId === 'image_validation' || activeWalkthroughNodeId === 'disease_classifier'}
              />
            </div>

            <ArchitectureNode
              node={ARCHITECTURE_NODES.disease_classifier}
              isSelected={isHighlighted('disease_classifier')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'disease_classifier'}
              isDimmed={isDimmed('disease_classifier')}
              onSelect={handleSelectNode}
            />
          </div>
        </div>

        {/* Directional Connector Down */}
        <div className="flow-connect-block">
          <ArchitectureConnector
            direction="down"
            length={32}
            label="Predicted Disease & Soil Nutrients Route to Specialized Models"
            isHighlighted={isPlaying}
          />
        </div>

        {/* SECTION 03 & 04: SEVERITY + YIELD (Parallel Specialized ML) */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">03 & 04</span>
            <span className="layer-clean-title">SPECIALIZED ML (SEVERITY & YIELD)</span>
          </div>

          <div className="arch-clean-parallel-grid">
            <div className="parallel-col">
              <span className="col-subtag font-mono">VISION-CONDITIONED</span>
              <ArchitectureNode
                node={ARCHITECTURE_NODES.severity_assessor}
                isSelected={isHighlighted('severity_assessor')}
                isActiveWalkthrough={activeWalkthroughNodeId === 'severity_assessor'}
                isDimmed={isDimmed('severity_assessor')}
                onSelect={handleSelectNode}
              />
            </div>

            <div className="parallel-col">
              <span className="col-subtag font-mono">TABULAR REGRESSOR</span>
              <ArchitectureNode
                node={ARCHITECTURE_NODES.yield_predictor}
                isSelected={isHighlighted('yield_predictor')}
                isActiveWalkthrough={activeWalkthroughNodeId === 'yield_predictor'}
                isDimmed={isDimmed('yield_predictor')}
                onSelect={handleSelectNode}
              />
            </div>
          </div>
        </div>

        {/* Convergence Connector */}
        <div className="flow-connect-block">
          <ArchitectureConnector
            direction="down"
            length={32}
            label="Inference Signals Converge into Deterministic Fusion Matrix"
            isHighlighted={isPlaying}
          />
        </div>

        {/* SECTION 05: DETERMINISTIC RISK FUSION */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">05</span>
            <span className="layer-clean-title">MULTI-SIGNAL RISK FUSION</span>
          </div>

          <ArchitectureNode
            node={ARCHITECTURE_NODES.risk_fusion}
            isSelected={isHighlighted('risk_fusion')}
            isActiveWalkthrough={activeWalkthroughNodeId === 'risk_fusion'}
            isDimmed={isDimmed('risk_fusion')}
            onSelect={handleSelectNode}
          />
        </div>

        {/* Connector Down */}
        <div className="flow-connect-block">
          <ArchitectureConnector
            direction="down"
            length={28}
            label="Combined Farm Risk Profile"
            isHighlighted={isPlaying}
          />
        </div>

        {/* SECTION 06: ENVIRONMENTAL WEATHER CONTEXT */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">06</span>
            <span className="layer-clean-title">METEOROLOGICAL CONTEXT (NON-ML)</span>
          </div>

          <ArchitectureNode
            node={ARCHITECTURE_NODES.environmental_context}
            isSelected={isHighlighted('environmental_context')}
            isActiveWalkthrough={activeWalkthroughNodeId === 'environmental_context'}
            isDimmed={isDimmed('environmental_context')}
            onSelect={handleSelectNode}
          />
        </div>

        {/* Connector Down */}
        <div className="flow-connect-block">
          <ArchitectureConnector
            direction="down"
            length={32}
            label="Verified ML Result + Weather Fed to AI Explainer"
            isHighlighted={isPlaying}
          />
        </div>

        {/* SECTION 07: GROUNDED AI EXPLAINER & VOICE */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">07</span>
            <span className="layer-clean-title">AI ASSISTANT & AUDIO EXPLANATION</span>
          </div>

          <div className="arch-clean-stack">
            <ArchitectureNode
              node={ARCHITECTURE_NODES.ai_assistant}
              isSelected={isHighlighted('ai_assistant')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'ai_assistant'}
              isDimmed={isDimmed('ai_assistant')}
              onSelect={handleSelectNode}
            />

            <div className="inner-connect-down">
              <ArchitectureConnector
                direction="down"
                length={26}
                label="Generated Advice"
                isHighlighted={activeWalkthroughNodeId === 'ai_assistant' || activeWalkthroughNodeId === 'voice_synthesis'}
              />
            </div>

            <ArchitectureNode
              node={ARCHITECTURE_NODES.voice_synthesis}
              isSelected={isHighlighted('voice_synthesis')}
              isActiveWalkthrough={activeWalkthroughNodeId === 'voice_synthesis'}
              isDimmed={isDimmed('voice_synthesis')}
              onSelect={handleSelectNode}
            />
          </div>
        </div>

        {/* Connector Down */}
        <div className="flow-connect-block">
          <ArchitectureConnector
            direction="down"
            length={32}
            label="Final Unified Report Delivery"
            isHighlighted={isPlaying}
          />
        </div>

        {/* SECTION 08: FINAL UNIFIED CROP HEALTH REPORT */}
        <div className="arch-clean-layer">
          <div className="layer-clean-header">
            <span className="layer-clean-num font-mono">08</span>
            <span className="layer-clean-title">FINAL DIAGNOSTIC REPORT CARD</span>
          </div>

          <ArchitectureNode
            node={ARCHITECTURE_NODES.crop_health_report}
            isSelected={isHighlighted('crop_health_report')}
            isActiveWalkthrough={activeWalkthroughNodeId === 'crop_health_report'}
            isDimmed={isDimmed('crop_health_report')}
            onSelect={handleSelectNode}
          />
        </div>
      </div>

      {/* 3. Centered, Non-Intrusive Modal Details Inspector */}
      <ArchitectureDetailModal
        selectedNodeId={selectedNodeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}
