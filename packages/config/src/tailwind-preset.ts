/**
 * Shared Tailwind preset. Apps (web, admin) and packages/ui extend this so the
 * whole monorepo consumes one brand theme. Colors map to the CSS variables in
 * `packages/ui/src/tokens/tokens.css`, so there is exactly one source of truth.
 *
 * NOTE: This file is duplicated structurally from the TS tokens to keep Tailwind
 * config statically analyzable. If a token changes, update both — `tokens.css`
 * for runtime CSS variables, and this preset for static Tailwind utilities.
 */

import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
          subtle: 'var(--primary-subtle)',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        'on-dark': 'var(--on-dark)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', '"Frank Ruhl Libre"', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Koulen', 'Impact', 'sans-serif'],
        body: ['var(--font-body)', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display scale (Koulen) — each step clearly above the heading scale below it.
        'display-xl': ['80px', { lineHeight: '1.0' }], // single-word hero statements
        'display-lg': ['72px', { lineHeight: '1.0' }], // primary hero display (was 60px)
        'display-md': ['60px', { lineHeight: '1.05' }], // section display (was 54px)
        'display-sm': ['46px', { lineHeight: '1.1' }], // subsection display (was 42px)
        // Heading scale (Frank Ruhl Libre) — clearly subordinate to display above.
        h1: ['60px', { lineHeight: '1.1' }],
        h2: ['42px', { lineHeight: '1.2' }],
        h3: ['32px', { lineHeight: '1.2' }],
        h4: ['24px', { lineHeight: '1.2' }],
        body: ['16px', { lineHeight: '1.6' }],
        'body-sm': ['14px', { lineHeight: '1.6' }],
        caption: ['12px', { lineHeight: '1.6' }],
      },
      spacing: {
        // 4px base scale — keys match packages/ui spacing tokens
        '0.5': '2px',
        '18': '72px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      maxWidth: { container: '1120px' },
      ringColor: { DEFAULT: 'var(--focus-ring)' },
      boxShadow: {
        sm: '0 1px 2px rgba(53, 13, 19, 0.06)',
        md: '0 4px 12px rgba(53, 13, 19, 0.10)',
        lg: '0 12px 32px rgba(53, 13, 19, 0.14)',
        xl: '0 24px 64px rgba(53, 13, 19, 0.18)',
        focus: '0 0 0 3px rgba(184, 31, 52, 0.45)',
      },
      screens: {
        sm: '600px',
        md: '900px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1440px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.25, 0, 0, 1)', // luxury ease-out (was Material ease-in-out)
        enter: 'cubic-bezier(0.25, 0, 0, 1)', // gentle arrival
        exit: 'cubic-bezier(0.4, 0, 1, 1)', // decisive departure — kept snappy
        emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)', // slight overshoot for emphasis moments
      },
      zIndex: {
        hide: '-1',
        base: '0',
        raised: '1',
        dropdown: '1000',
        sticky: '1100',
        overlay: '1200',
        modal: '1300',
        popover: '1400',
        toast: '1500',
        tooltip: '1600',
      },
    },
  },
};

export default preset;
