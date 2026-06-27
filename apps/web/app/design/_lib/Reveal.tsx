'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { motion as motionTokens } from '@offisdesign/ui';

export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper reading the design system's motion tokens.
 * Honours prefers-reduced-motion by skipping the animation entirely.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: motionTokens.reveal.distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{
        duration: motionTokens.reveal.duration,
        ease: motionTokens.reveal.ease,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealStack({
  children,
  className,
}: {
  children: React.ReactNode[];
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <Reveal delay={i * motionTokens.reveal.stagger}>{child}</Reveal>
      ))}
    </div>
  );
}
