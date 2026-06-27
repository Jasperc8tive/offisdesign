/**
 * Brand color tokens — single source of truth.
 *
 * These are the ONLY place hex values are allowed to live. Every component,
 * Tailwind utility, CSS variable, and shadcn theme value is derived from here.
 * Never hardcode a hex anywhere else in the codebase.
 *
 * Brand palette (adopted pre-Stage 2; supersedes the reference site's sage/cream).
 */

export const palette = {
  /** Primary brand — CTAs, active states, links, icons, highlights, badges. */
  primary: '#B81F34',
  /** Secondary — headings, navigation, footer, large dark blocks, cards, product titles. */
  secondary: '#410C14',
  /** Accent — hover, borders, dividers, secondary buttons, inputs, focus, shadows. */
  accent: '#350D13',
  /** Background — page/section/form/card/container surfaces. */
  background: '#FEFEFE',
  /** Primary body copy. */
  text: '#410C14',
} as const;

/**
 * Derived states (computed, not invented) so interactions have depth while
 * staying inside the brand family. Kept here so components never improvise.
 */
export const states = {
  /** Primary CTA hover — primary nudged toward accent. */
  primaryHover: '#A01B2D',
  /** Primary pressed/active. */
  primaryActive: '#8A1727',
  /** Subtle primary tint for hover backgrounds / selected rows (8% on white). */
  primarySubtle: 'rgba(184, 31, 52, 0.08)',
  /** Focus ring (primary @ 45% — visible on light surfaces). */
  focusRing: 'rgba(184, 31, 52, 0.45)',
  /** Hairline borders / dividers on light surfaces. */
  border: 'rgba(65, 12, 20, 0.14)',
  /** Stronger border (inputs, focus-within). */
  borderStrong: 'rgba(65, 12, 20, 0.28)',
  /** Muted/secondary text on background — derived from text, meets AA. */
  muted: 'rgba(65, 12, 20, 0.66)',
  /** Foreground to use ON primary/secondary/accent fills. */
  onDark: '#FEFEFE',
} as const;

export const colors = { ...palette, ...states } as const;

export type ColorToken = keyof typeof colors;
