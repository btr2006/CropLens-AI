import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * StaggerGrid
 * Animates children with staggered entrance effect.
 * Perfect for feature grids, step cards, or any grid/flex layout.
 *
 * @param {string} className - Grid class (e.g., 'saas-features-grid')
 * @param {number} delay - Start delay in seconds
 * @param {number} stagger - Delay between children in seconds
 */
export default function StaggerGrid({
  children,
  className = '',
  delay = 0.1,
  stagger = 0.1,
  style = {},
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 24, filter: 'blur(3px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div variants={item} style={{ height: '100%' }}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
