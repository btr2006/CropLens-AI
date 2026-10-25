import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * MagicText
 * 21st.dev / Magic Text style progressive AI text reveal.
 * Animates text progressively with smooth opacity, subtle translateY,
 * and delicate blur decay to create a natural AI streaming/presentation feel.
 *
 * @param {string} text - The dynamic text string to reveal
 * @param {Array<string>} items - Optional array of strings for list mode
 * @param {string} mode - 'word' | 'phrase' | 'list'
 * @param {any} resetKey - Trigger to re-run animation on content change (e.g. on Regenerate)
 * @param {string} className - Optional styling classes
 * @param {string} as - HTML tag to render
 * @param {number} delay - Base start delay in seconds
 * @param {number} stagger - Stagger delay between tokens
 * @param {number} duration - Transition duration per token
 */
export default function MagicText({
  text = '',
  items = [],
  mode = 'word',
  resetKey = null,
  className = '',
  as: Component = 'div',
  delay = 0.05,
  stagger = 0.028,
  duration = 0.38,
  style = {},
  ...props
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();

  // 1. Accessibility / Reduced Motion Fallback: Immediate render
  if (shouldReduceMotion) {
    if (mode === 'list') {
      return (
        <ul className={className} style={{ margin: 0, paddingLeft: '1.125rem', fontSize: '0.875rem', color: 'var(--forest-900)', lineHeight: '1.5', ...style }}>
          {items && items.length > 0 ? (
            items.map((item, i) => <li key={i} style={{ marginBottom: '0.375rem' }}>{item}</li>)
          ) : (
            <li>No items available.</li>
          )}
        </ul>
      );
    }
    return (
      <Component className={className} style={style} {...props}>
        {text}
      </Component>
    );
  }

  // 2. List Mode: Staggered Bullet List
  if (mode === 'list') {
    const listItems = Array.isArray(items) && items.length > 0 ? items : (text ? [text] : []);

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: delay,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 6, filter: 'blur(2px)' },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      },
    };

    return (
      <motion.ul
        key={typeof resetKey === 'object' ? JSON.stringify(resetKey?.summary || resetKey) : String(resetKey)}
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className={className}
        style={{
          margin: 0,
          paddingLeft: '1.125rem',
          fontSize: '0.875rem',
          color: 'var(--forest-900)',
          lineHeight: '1.5',
          ...style,
        }}
        {...props}
      >
        {listItems.map((item, idx) => (
          <motion.li key={idx} variants={itemVariants} style={{ marginBottom: '0.375rem' }}>
            {item}
          </motion.li>
        ))}
      </motion.ul>
    );
  }

  // 3. Phrase / Sentence Mode (for longer explanatory paragraphs)
  if (mode === 'phrase') {
    const rawContent = String(text || '').trim();
    if (!rawContent) return null;

    // Split by sentence boundaries while preserving punctuation
    const sentences = rawContent.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [rawContent];

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.12,
          delayChildren: delay,
        },
      },
    };

    const sentenceVariants = {
      hidden: { opacity: 0, y: 8, filter: 'blur(2.5px)' },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
      },
    };

    return (
      <motion.div
        key={typeof resetKey === 'object' ? JSON.stringify(resetKey?.what_it_means || resetKey) : String(resetKey)}
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className={`magic-text-container ${className}`}
        style={style}
        {...props}
      >
        {sentences.map((sentence, sIdx) => (
          <motion.span
            key={sIdx}
            variants={sentenceVariants}
            style={{ display: 'inline', willChange: 'opacity, transform, filter' }}
          >
            {sentence}{' '}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  // 4. Default Word Mode (for high-impact progressive summary reveal)
  const rawContent = String(text || '').trim();
  if (!rawContent) return null;

  const words = rawContent.split(/\s+/);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 5, filter: 'blur(2px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      key={typeof resetKey === 'object' ? JSON.stringify(resetKey?.summary || resetKey) : String(resetKey)}
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={`magic-text-container ${className}`}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        rowGap: '0.15em',
        columnGap: '0.28em',
        ...style,
      }}
      {...props}
    >
      {words.map((word, wIdx) => (
        <motion.span
          key={wIdx}
          variants={wordVariants}
          style={{
            display: 'inline-block',
            willChange: 'opacity, transform, filter',
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
