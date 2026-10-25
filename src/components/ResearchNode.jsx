import React from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Cpu,
  Database,
  FileText,
  Activity,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

const ICON_MAP = {
  node_disease: Cpu,
  node_severity: Activity,
  node_yield: TrendingUp,
  node_risk: ShieldAlert,
  node_ai: Sparkles,
  node_plantvillage: Database,
  node_aichallenger: Database,
  node_yield_dataset: Database,
  node_rocole: Database,
  node_mobilenet: Cpu,
  paper_mohanty: FileText,
  paper_severity: FileText,
  paper_breiman: FileText,
  paper_mobilenet: FileText,
  paper_rocole: FileText,
};

export default function ResearchNode({
  node,
  isSelected,
  isActiveWalkthrough,
  isDimmed,
  isHighlightedRelation,
  onSelect,
}) {
  const IconComponent = ICON_MAP[node.id] || FileText;
  const isGlowing = isSelected || isActiveWalkthrough || isHighlightedRelation;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(node.id);
    }
  };

  const getBadgeClass = (typeBadge) => {
    switch (typeBadge) {
      case 'OUR MODEL':
        return 'res-badge-model';
      case 'SOURCE DATASET':
        return 'res-badge-dataset';
      case 'SOURCE PAPER':
        return 'res-badge-paper';
      case 'PREVIOUS / EXPLORATORY':
        return 'res-badge-exploratory';
      default:
        return 'res-badge-default';
    }
  };

  return (
    <motion.div
      className={`research-node-box ${isSelected ? 'selected' : ''} ${
        isActiveWalkthrough ? 'active-walkthrough' : ''
      } ${isHighlightedRelation ? 'highlighted-relation' : ''} ${isDimmed ? 'dimmed' : ''}`}
      onClick={() => onSelect(node.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      aria-label={`${node.title} - ${node.typeBadge}. Click to inspect research evidence.`}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Top Header Strip */}
      <div className="res-node-top">
        <span className={`res-type-pill ${getBadgeClass(node.typeBadge)}`}>
          {node.typeBadge}
        </span>
        {node.sourceUrl ? (
          <a
            href={node.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="res-external-pill"
            onClick={(e) => e.stopPropagation()}
            title="Open Verified Source in new tab"
          >
            <span>Source</span>
            <ExternalLink size={11} />
          </a>
        ) : (
          <span className="res-type-label font-mono">{node.type}</span>
        )}
      </div>

      {/* Main Body */}
      <div className="res-node-main">
        <div className={`res-node-icon-wrap ${getBadgeClass(node.typeBadge)}`}>
          <IconComponent size={16} />
        </div>
        <div className="res-node-info">
          {node.sourceUrl ? (
            <a
              href={node.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="res-node-title-link"
              onClick={(e) => e.stopPropagation()}
              title="Click to open verified publication/dataset"
            >
              <span>{node.title}</span>
              <ArrowUpRight size={13} className="title-arrow" />
            </a>
          ) : (
            <h4 className="res-node-title">{node.title}</h4>
          )}
          <p className="res-node-role">{node.roleInCropGuard}</p>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="res-node-footer">
        {node.ourResult ? (
          <span className="res-result-tag font-mono">
            {node.ourResult.split('(')[0]}
          </span>
        ) : (
          <span className="res-source-tag font-mono">
            {node.sourceName}
          </span>
        )}
        <span className="res-inspect-hint font-mono">
          Details ↗
        </span>
      </div>

      {isGlowing && <span className="res-active-beacon" aria-hidden="true" />}
    </motion.div>
  );
}
