import React from 'react';
import { motion } from 'framer-motion';

export default function ArchitectureConnector({
  direction = 'down', // 'down' | 'right' | 'branch-left' | 'branch-right'
  label = '',
  isHighlighted = false,
  length = 36,
}) {
  if (direction === 'down') {
    return (
      <div className={`arch-connector vertical ${isHighlighted ? 'highlighted' : ''}`} style={{ height: `${length}px` }}>
        <svg
          className="arch-connector-svg"
          width="24"
          height={length}
          viewBox={`0 0 24 ${length}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Base Track */}
          <line
            x1="12"
            y1="0"
            x2="12"
            y2={length - 6}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="3 3"
            className="connector-track"
          />
          {/* Animated Flow Dash */}
          <line
            x1="12"
            y1="0"
            x2="12"
            y2={length - 6}
            stroke="var(--leaf-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="connector-pulse-line"
          />
          {/* Arrowhead */}
          <polygon
            points={`8,${length - 8} 16,${length - 8} 12,${length}`}
            fill="currentColor"
            className="connector-arrowhead"
          />
        </svg>
        {label && <span className="arch-connector-label">{label}</span>}
      </div>
    );
  }

  if (direction === 'right') {
    return (
      <div className={`arch-connector horizontal ${isHighlighted ? 'highlighted' : ''}`} style={{ width: `${length}px` }}>
        <svg
          className="arch-connector-svg"
          width={length}
          height="24"
          viewBox={`0 0 ${length} 24`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="12"
            x2={length - 6}
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="3 3"
            className="connector-track"
          />
          <line
            x1="0"
            y1="12"
            x2={length - 6}
            y2="12"
            stroke="var(--leaf-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="connector-pulse-line"
          />
          <polygon
            points={`${length - 8},8 ${length - 8},16 ${length},12`}
            fill="currentColor"
            className="connector-arrowhead"
          />
        </svg>
        {label && <span className="arch-connector-label">{label}</span>}
      </div>
    );
  }

  // Branch connector (elbow path for converging streams)
  return (
    <div className={`arch-connector branch ${direction} ${isHighlighted ? 'highlighted' : ''}`}>
      <svg
        className="arch-connector-svg"
        width="100%"
        height="40"
        viewBox="0 0 120 40"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d={
            direction === 'branch-left'
              ? 'M 10 0 C 10 20, 60 20, 60 40'
              : 'M 110 0 C 110 20, 60 20, 60 40'
          }
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="connector-track"
        />
        <path
          d={
            direction === 'branch-left'
              ? 'M 10 0 C 10 20, 60 20, 60 40'
              : 'M 110 0 C 110 20, 60 20, 60 40'
          }
          stroke="var(--leaf-500)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          className="connector-pulse-line"
        />
      </svg>
      {label && <span className="arch-connector-label">{label}</span>}
    </div>
  );
}
