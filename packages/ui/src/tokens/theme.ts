/**
 * Aggregated theme object + shadcn/ui HSL channel mappings.
 *
 * `cssVars` is the canonical CSS custom-property contract consumed by
 * `tokens.css` (and therefore by Tailwind's `--*` and shadcn components).
 * shadcn expects space-separated HSL *channels* (no `hsl()` wrapper).
 */

import { colors, palette } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { motion } from './motion';
import { breakpoints } from './breakpoints';
import { zIndex } from './z-index';

export const theme = {
  colors,
  typography,
  spacing,
  layout,
  radius,
  shadows,
  motion,
  breakpoints,
  zIndex,
} as const;

/** Brand colors as shadcn-compatible HSL channels (H S% L%). */
export const shadcnHsl = {
  primary: '350 71% 42%', // #B81F34
  secondary: '349 70% 15%', // #410C14
  accent: '350 60% 13%', // #350D13
  background: '0 0% 100%', // #FEFEFE
  foreground: '349 70% 15%', // text = secondary
} as const;

/** Flat CSS-variable contract written into :root by tokens.css. */
export const cssVars = {
  '--primary': palette.primary,
  '--secondary': palette.secondary,
  '--accent': palette.accent,
  '--background': palette.background,
  '--text': palette.text,
  '--primary-hover': colors.primaryHover,
  '--primary-active': colors.primaryActive,
  '--primary-subtle': colors.primarySubtle,
  '--border': colors.border,
  '--border-strong': colors.borderStrong,
  '--muted': colors.muted,
  '--on-dark': colors.onDark,
  '--focus-ring': colors.focusRing,
  '--surface': colors.surface,
} as const;

export type Theme = typeof theme;
