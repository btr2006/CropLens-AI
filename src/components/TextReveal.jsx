import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * TextReveal
 * 21st.dev style subtle text reveal with staggered word appearance,
 * soft blur fade-in, and viewport-based trigger.
 *
 * @param {string} text - The text string to reveal (can also pass children if string)
 * @param {string} className - Wrapper classes
 * @param {string} as - HTML tag to render ('h1' | 'h2' | 'h3' | 'p' | 'span' | 'div')
 * @param {number} delay - Initial animation delay in seconds
 * @param {number} stagger - Delay between consecutive words
 * @param {number} duration - Transition duration per word
 * @param {boolean} once - If true, animation triggers once and persists
 * @param {string} mode - 'word' | 'line' | 'fade'
 */
export default function TextReveal({
  text,
  children,
  className = '',
  as: Component = 'div',
  delay = 0,
  stagger = 0.05,
  duration = 0.45,
  once = true,
  mode = 'word',
  style = {},
  ...props
}) {
  const content = text || (typeof children === 'string' ? children : '');
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-50px' });
  const shouldReduceMotion = useReducedMotion();

  // If complex children or reduced motion is requested, render cleanly without animation
  if (!content || shouldReduceMotion) {
    return (
      <Component className={className} style={style} {...props}>
        {children || text}
      </Component>
    );
  }

  // Split content based on mode
  if (mode === 'line') {
    const lines = content.split('\n');

    return (
      <Component ref={ref} className={`text-reveal-wrapper ${className}`} style={style} {...props}>
        {lines.map((line, lineIdx) => (
          <span key={lineIdx} style={{ display: 'block', overflow: 'hidden' }}>
            <motion.span
              style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 14, filter: 'blur(4px)' }}
              transition={{
                duration,
                delay: delay + lineIdx * (stagger * 2.5),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </Component>
    );
  }

  if (mode === 'fade') {
    return (
      <Component ref={ref} className={`text-reveal-wrapper ${className}`} style={style} {...props}>
        <motion.span
          style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
          initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 10, filter: 'blur(3px)' }}
          transition={{
            duration,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {content}
        </motion.span>
      </Component>
    );
  }

  // Default: Word-by-word staggered reveal
  const words = content.split(' ');

  return (
    <Component ref={ref} className={`text-reveal-wrapper ${className}`} style={{ ...style, display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em' }} {...props}>
      {words.map((word, index) => (
        <span key={index} style={{ display: 'inline-block', overflow: 'hidden' }}>
          <motion.span
            style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
            initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 10, filter: 'blur(3px)' }}
            transition={{
              duration,
              delay: delay + index * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}
