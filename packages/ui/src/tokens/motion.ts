/**
 * Motion tokens — UNCHANGED from Stage 1 per re-theme directive.
 * Only color styling moved to brand tokens; timing/easing/transitions stay.
 */

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const easing = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-in-out
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

/** Scroll-reveal cascade (gentle slide-in + staggered children). */
export const reveal = {
  distance: 24, // px
  stagger: 0.08, // s between children
  duration: duration.base / 1000,
  ease: [0.4, 0, 0.2, 1] as const,
} as const;

export const motion = { duration, easing, reveal } as const;
