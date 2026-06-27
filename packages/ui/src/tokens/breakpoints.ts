/** Responsive breakpoints (unchanged from Stage 1 analysis). */

export const breakpoints = {
  sm: '600px',
  md: '900px',
  lg: '1024px',
  xl: '1200px',
  '2xl': '1440px',
} as const;

export type BreakpointToken = keyof typeof breakpoints;
