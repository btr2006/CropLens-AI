import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * AnimatedSection
 * Scroll-triggered reveal wrapper for landing page sections.
 * Applies a smooth fade-up + optional scale animation when scrolling into viewport.
 *
 * @param {React.ReactNode} children
 * @param {string} className
 * @param {number} delay - Additional delay in seconds
 * @param {'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleUp'} variant
 * @param {boolean} once - Only animate once (default: true)
 */
export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  variant = 'fadeUp',
  once = true,
  style = {},
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    );
  }

  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slideLeft: {
      hidden: { opacity: 0, x: 60 },
      visible: { opacity: 1, x: 0 },
    },
    slideRight: {
      hidden: { opacity: 0, x: -60 },
      visible: { opacity: 1, x: 0 },
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.92 },
      visible: { opacity: 1, scale: 1 },
    },
  };

  const selected = variants[variant] || variants.fadeUp;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={selected.hidden}
      animate={isInView ? selected.visible : selected.hidden}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
