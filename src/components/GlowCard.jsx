import React, { useRef, useCallback } from 'react';

/**
 * GlowCard
 * Modern 21st.dev / Open SaaS cursor-following spotlight card.
 * Tracks mouse coordinates locally via CSS variables (--mouse-x, --mouse-y)
 * with a subtle radial spotlight gradient and illuminated border.
 *
 * @param {string} glowColor - 'green' | 'orange' | 'blue' | 'purple' (default: 'green')
 * @param {string} className - Optional additional CSS classes
 * @param {React.ReactNode} children - Card content
 */
export default function GlowCard({
  children,
  glowColor = 'green',
  className = '',
  style = {},
  ...props
}) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.style.setProperty('--glow-opacity', '1');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.style.setProperty('--glow-opacity', '0');
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`glow-card glow-${glowColor} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
      {...props}
    >
      {/* Dynamic Cursor Radial Spotlight Glow Layer */}
      <div className="glow-spotlight" aria-hidden="true" />

      {/* Card Content */}
      <div className="glow-card-content">
        {children}
      </div>
    </div>
  );
}
