/**
 * Typography tokens. Type families & scale are unchanged from Stage 1
 * (reference site's information architecture is preserved); only color
 * application moves to brand tokens.
 */

export const fontFamily = {
  /** Headings — humanist serif. */
  heading: ['"Frank Ruhl Libre"', 'Georgia', 'serif'],
  /** Display / oversized labels. */
  display: ['Koulen', 'Impact', 'sans-serif'],
  /** Body & UI — rounded sans. */
  body: ['Quicksand', 'system-ui', 'sans-serif'],
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** Type scale (px) — H1 steps down responsively; body steps for UI. */
export const fontSize = {
  h1: { lg: 60, md: 54, sm: 42 },
  h2: 42,
  h3: 32,
  h4: 24,
  body: 16, // mobile floor is 16px even though brand default ran 14
  bodySm: 14,
  caption: 12,
} as const;

export const lineHeight = {
  tight: 1.1,
  heading: 1.2,
  body: 1.6,
  relaxed: 1.75,
} as const;

export const typography = { fontFamily, fontWeight, fontSize, lineHeight } as const;
