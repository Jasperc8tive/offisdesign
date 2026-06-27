# Accessibility

The storefront targets **WCAG 2.1 AA**. Lighthouse CI enforces an accessibility score of 100 on every audited route — a regression fails the build.

## Structure

- **Landmarks.** `app/(shop)/layout.tsx` exposes `<header>`, `<nav aria-label="Primary">`, `<main id="main">`, `<footer>`. Each page renders inside the existing `<main>` so screen readers always have a single primary landmark.
- **Skip link.** A "Skip to content" anchor is the first focusable element in the shop layout; it targets `#main` so keyboard users can bypass the global nav.
- **Heading hierarchy.** Each page exposes one `<h1>` (`<Heading level={1}>`). The `@offisdesign/ui` `Heading` component restricts levels to 1–4 by type, blocking accidental skips at compile time.

## Keyboard navigation

- All interactive controls render as buttons, links, or form inputs — no `<div onClick>`.
- Focus rings come from a shared `focus-visible:shadow-focus` utility; never disabled per-component.
- The PDP gallery thumbnails are `<button>` elements with `aria-pressed` for the active state, so screen readers announce selection changes.

## Forms

- `<FormField>` from the design system wraps every input with a programmatically associated `<label>`. Error text is surfaced via `aria-describedby`.
- Required fields use the native `required` attribute plus visible `*` markers — both signals are needed for AT compatibility.
- The checkout address form's "Billing same as shipping" toggle is a `<Checkbox>` (not a custom div) so its state is exposed natively.

## Dialogs and drawers

When you add a modal or drawer (none today), use the design system's `<Dialog>` primitive — it ships with focus trap, ESC dismissal, and `aria-modal="true"`. Restore focus to the trigger on close.

## Forms in checkout

- The contact email input on `/checkout` is `type="email"`, marked `required`, and has visible placeholder + label text.
- The Stripe Payment Element manages its own ARIA wiring — we don't wrap it in additional ARIA that could conflict.
- The review step uses `<Heading level={4}>` for each section and explicit `Edit` buttons that announce the destination step.

## Reviews bar chart

The five-bucket rating histogram on the PDP is presented as decorative bars with `role="img"` and an `aria-label` like `"3 4-star reviews"`. Screen-reader users get the count without having to parse a visual bar.

## Reduced motion

The hover-zoom on the PDP gallery uses Tailwind motion utilities. The design system's global stylesheet honours `prefers-reduced-motion` by collapsing transitions to `0ms` — verify when adding any new animation that you reuse the existing motion tokens rather than hand-rolling.

## Contrast

The brand palette (`packages/ui/src/tokens/`) was tuned so all body text on canvas and primary surfaces meets WCAG AA contrast at minimum 4.5:1. Subdued copy (`tone="muted"`) only appears for non-essential supplementary information.

## What's tested

- Lighthouse CI on each PR (5 routes).
- Storybook a11y addon during component development.

## Known gaps / future work

1. **Automated axe-core unit tests.** Wire `vitest-axe` (or `@axe-core/playwright`) into the existing test setup so accessibility regressions surface at the unit level, not only at Lighthouse-CI time.
2. **Screen-reader-only navigation tour.** Add a `<nav aria-label="Account">` landmark to the customer account section so AT users can jump directly between dashboard / orders / addresses / sessions.
3. **Live region for cart updates.** Add a polite live region near the header bag count so AT users hear "Added to bag" updates without watching the toast.
