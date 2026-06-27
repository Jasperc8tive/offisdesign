/**
 * Shadow tokens. Tinted with the accent color (#350D13) rather than neutral
 * black so elevation stays inside the brand family.
 */

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(53, 13, 19, 0.06)',
  md: '0 4px 12px rgba(53, 13, 19, 0.10)',
  lg: '0 12px 32px rgba(53, 13, 19, 0.14)',
  xl: '0 24px 64px rgba(53, 13, 19, 0.18)',
  /** Focus ring shadow (primary). */
  focus: '0 0 0 3px rgba(184, 31, 52, 0.45)',
} as const;

export type ShadowToken = keyof typeof shadows;
