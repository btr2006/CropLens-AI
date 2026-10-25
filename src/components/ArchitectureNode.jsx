import React from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Sliders,
  CloudSun,
  CheckCircle2,
  Cpu,
  Activity,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Volume2,
  FileText,
  Zap,
  ArrowUpRight,
} from 'lucide-react';

const ICON_MAP = {
  Camera,
  Sliders,
  CloudSun,
  CheckCircle2,
  Cpu,
  Activity,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Volume2,
  FileText,
  Zap,
};

export default function ArchitectureNode({
  node,
  isSelected,
  isActiveWalkthrough,
  isDimmed,
  onSelect,
}) {
  const IconComponent = ICON_MAP[node.iconName] || Zap;
  const isHighlighted = isSelected || isActiveWalkthrough;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(node.id);
    }
  };

  const getTechColorClass = (techType) => {
    switch (techType) {
      case 'neural-net':
        return 'node-tech-neural';
      case 'tabular-ml':
        return 'node-tech-tabular';
      case 'deterministic':
        return 'node-tech-deterministic';
      case 'llm':
        return 'node-tech-llm';
      case 'api':
        return 'node-tech-api';
      case 'output':
        return 'node-tech-output';
      default:
        return 'node-tech-input';
    }
  };

  return (
    <motion.button
      type="button"
      className={`arch-node-card-clean ${isSelected ? 'selected' : ''} ${
        isActiveWalkthrough ? 'active-walkthrough' : ''
      } ${isDimmed ? 'dimmed' : ''}`}
      onClick={() => onSelect(node.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      aria-label={`${node.title} - ${node.badge}. Click to inspect specifications.`}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="node-clean-top">
        <span className="node-clean-stage font-mono">
          {node.stageNumber ? `0${node.stageNumber}` : node.shortLabel}
        </span>
        <span className={`node-clean-badge ${getTechColorClass(node.techType)}`}>
          {node.badge}
        </span>
      </div>

      <div className="node-clean-main">
        <div className={`node-clean-icon-wrap ${getTechColorClass(node.techType)}`}>
          <IconComponent size={18} />
        </div>
        <div className="node-clean-text">
          <h4 className="node-clean-title">{node.title}</h4>
          <p className="node-clean-desc">{node.summary}</p>
        </div>
      </div>

      <div className="node-clean-footer">
        <span className="node-clean-io font-mono">
          {node.inputs[0]?.name} → {node.outputs[0]?.name}
        </span>
        <span className="node-clean-hint">
          Inspect <ArrowUpRight size={13} />
        </span>
      </div>

      {isHighlighted && <span className="node-clean-beacon" aria-hidden="true" />}
    </motion.button>
  );
}
