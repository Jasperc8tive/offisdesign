/** Border-radius tokens (unchanged from Stage 1). Buttons & inputs = 4px. */

export const radius = {
  none: '0',
  sm: '4px', // buttons, inputs
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof radius;
