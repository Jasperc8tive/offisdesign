# Accessibility Audit (Stage 3.6)

Manual audit of the showcase and eight prototype layouts, plus rules baked
into the components themselves.

## Scope

- Keyboard navigation (Tab / Shift+Tab / Enter / Space / Esc / arrow keys
  where applicable).
- Focus order and visibility.
- Colour contrast at WCAG AA.
- Screen reader labelling (role, name, state).
- Landmark structure.
- Heading hierarchy.
- Reduced-motion behaviour.

Automated coverage continues via `@storybook/addon-a11y` (axe) in Storybook.

## Component-level guarantees

| Component        | Role / semantics                                                                                                                  | Notes                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Button           | Native `<button>`, `aria-busy` while loading                                                                                      | Keyboard: Space/Enter                |
| NavLink          | `<a>` + `aria-current="page"` when active                                                                                         | Underline + colour change            |
| Breadcrumb       | `<nav aria-label="Breadcrumb">` + `<ol>`                                                                                          | Last item `aria-current="page"`      |
| Tabs             | `role="tablist"` + `aria-label`; tabs `role="tab"`, `aria-selected`, `aria-controls`; panels `role="tabpanel"`; roving `tabIndex` | Click + keyboard activation          |
| Pagination       | `<nav aria-label="Pagination">`; active page `aria-current="page"`; prev/next `aria-label`                                        | Disabled at boundaries               |
| Quantity         | `role="group"` + label; +/- buttons have explicit `aria-label`; number input keeps `inputMode="numeric"`                          | Native input min/max enforced        |
| Swatch           | `role="radiogroup"` + `role="radio"` + `aria-checked` + per-option `aria-label`                                                   | Disabled options non-interactive     |
| Rating           | `role="img"` with `aria-label` summary                                                                                            | Stars purely decorative              |
| Checkbox / Radio | Native input under styled overlay; labels via `<label htmlFor>`                                                                   | Full keyboard support                |
| Switch           | `role="switch"` + `aria-checked`                                                                                                  | Activated by Space/Enter             |
| FormField        | Clones child to inject `aria-describedby` pointing at helper/error nodes                                                          | One label per control                |
| Alert            | `role="alert"` for warning/error (assertive); `role="status"` for info/success (polite); dismiss has `aria-label`                 | —                                    |
| Tooltip          | `role="tooltip"` linked via `aria-describedby` on trigger; opens on hover **and** focus                                           | Trigger keeps own keyboard semantics |
| Spinner          | `role="status"` + `aria-label`                                                                                                    | —                                    |
| Progress         | `role="progressbar"` + `aria-valuenow/min/max` + label                                                                            | —                                    |
| EmptyState       | Heading + description + action; no overload of `role="alert"`                                                                     | —                                    |
| Avatar           | Image with `alt`; initials hidden from AT when image succeeds                                                                     | —                                    |
| Icon             | `decorative` → `aria-hidden`; `title` → `role="img"` + `aria-label`                                                               | Never ambiguous                      |

## Page-level audit findings

### 1. Keyboard navigation

- **Skip link** — Added a "Skip to content" link to `(design)/layout.tsx`. It
  is `sr-only` until focused, then appears with brand styling near the top-left
  and jumps to `#main`.
- **Focus order** — Verified by tabbing through `/design/components`,
  `/design/checkout`, and `/design/product`. Order follows DOM, which follows
  visual order on every viewport.
- **Trapped focus** — No modals in this stage; cart drawer is inlined, not a
  dialog. Real drawer implementation (Stage 6+) will introduce a focus trap and
  Esc handler.

### 2. Focus visibility

- Every interactive element exposes `focus-visible:shadow-focus` (the brand
  focus ring, `0 0 0 3px rgba(184,31,52,0.45)`) or a `ring-2 ring-primary`
  variant. No `:focus { outline: none }` without a replacement.

### 3. Landmark structure

Each page provides:

- `<header>` from the design layout.
- `<aside>` for the sidebar nav.
- `<main id="main">` wrapping the page content.
- Prototype-specific `<nav>`, `<section>`, `<article>`, `<aside>` as the
  content dictates (Checkout, Collection, Blog, Account).

### 4. Heading hierarchy

- One `<h1>` per page (or `<h2>` if the page is consumed under a parent header
  that already provides `<h1>` — the Cart-Drawer prototype intentionally starts
  at `h2` because in production it sits inside another page's `<h1>`).
- Sub-blocks use `<h2>` → `<h3>` → `<h4>`. No skipped levels.

### 5. Contrast ratios

All combinations verified manually:

| Pairing                                               | Ratio  | Status                |
| ----------------------------------------------------- | ------ | --------------------- |
| Body `#410C14` on `#FEFEFE`                           | 16.1:1 | AAA                   |
| Muted `rgba(65,12,20,0.66)` on `#FEFEFE`              | 5.9:1  | AA                    |
| Primary `#B81F34` on `#FEFEFE`                        | 6.3:1  | AAA large / AA normal |
| `#FEFEFE` on Primary `#B81F34`                        | 6.3:1  | AAA large / AA normal |
| `#FEFEFE` on Secondary `#410C14`                      | 16.1:1 | AAA                   |
| Border-strong `rgba(65,12,20,0.28)` (decorative only) | —      | n/a                   |

Brand rule still enforced: **never small `#B81F34` text on a dark fill** — no
prototype violates this.

### 6. Screen reader labels

- All decorative icons set `aria-hidden`.
- Every actionable icon-only button has `aria-label` (cart close, line-item
  remove, wishlist save, pagination prev/next, quantity +/-, alert dismiss,
  swatch options).
- Form inputs all use `FormField` so labels and helper/error wiring are
  consistent.
- Image fallbacks: prototype gallery cells are `bg-primary-subtle`
  placeholders, not `<img>` elements; no missing `alt` risk.

### 7. Reduced motion

- `apps/web/app/(design)/_lib/Reveal.tsx` consults
  `useReducedMotion()` from Framer Motion; on `prefers-reduced-motion`, the
  wrapper renders a plain `<div>` with no animation.
- `apps/web/app/globals.css` adds a global `@media (prefers-reduced-motion:
reduce)` block that flattens animations and transitions to `0.001ms`. This
  covers components that use Tailwind transition utilities directly.

## Open items

None. All findings above were either resolved or were already covered by
component design. Stage 6+ feature work will need to revisit:

- Real drawer/modal focus trap + Esc handling.
- Toast region (live region) — Alert is in place, toast container is a
  separate piece.
- Long-form form validation announcements via `aria-live`.
