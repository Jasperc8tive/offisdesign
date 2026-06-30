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
  /**
   * Primary luxury ease-out — unhurried, confident arrivals.
   * Replaces Material's assertive ease-in-out for hover/transition states.
   */
  standard: 'cubic-bezier(0.25, 0, 0, 1)',
  /** Element entering the screen — same gentle ease-out. */
  enter: 'cubic-bezier(0.25, 0, 0, 1)',
  /** Element leaving — kept snappy so departures feel decisive. */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Slight overshoot for attention-directing moments (e.g. cart badge pop). */
  emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
} as const;

/** Scroll-reveal cascade (gentle slide-in + staggered children). */
export const reveal = {
  distance: 24, // px
  stagger: 0.08, // s between children
  duration: duration.base / 1000,
  ease: [0.4, 0, 0.2, 1] as const,
} as const;

export const motion = { duration, easing, reveal } as const;
