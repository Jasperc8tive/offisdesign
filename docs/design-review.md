# Design Review (Stage 3.6)

Visual consistency audit across the showcase and eight prototype layouts.

## Method

1. Render every `(design)` route at viewport widths 360 / 768 / 1024 / 1440 / 1920.
2. For each of the categories below, look for a) unintended variation and b)
   missed reuses of an existing primitive.
3. Fix any issue at its source (preset or component) — not at the call site —
   unless the variation is intentional.

## Findings & resolutions

### Spacing

- **Finding** — Vertical rhythm between major sections was unintentionally
  drifting between layouts (gap of `12` on some, `16` on others).
- **Resolution** — Standardised on `Stack gap={16}` for top-level page rhythm
  (Home, CMS, Blog) and `Stack gap={8}` for nested section groups. Forms use
  `gap={4}`.
- **Status** — Resolved.

### Typography

- **Finding** — `Heading level={2}` was used for both page titles in some
  prototypes and section headings in others.
- **Resolution** — Page titles use `Heading level={1}` (or `Display` for hero
  moments); in-page sections use `level={2}` then `level={3}`/`level={4}` for
  sub-blocks. Showcase `<Section>` helper enforces this by injecting an
  `id` and `aria-labelledby`.
- **Status** — Resolved.

### Border radius

- **Finding** — `rounded-sm` (4px) is everywhere on inputs/buttons (matches
  tokens). Images and cards used `rounded-md` consistently. No drift.
- **Status** — Pass.

### Elevation / shadows

- **Finding** — Cards default to `shadow-sm`. Interactive cards animate to
  `shadow-md` on hover, focus exposes `shadow-focus`. Order-summary cards in
  Checkout briefly used `shadow-lg`, which felt heavier than the surface
  required.
- **Resolution** — Order summary now relies on `Card` defaults; no override.
- **Status** — Resolved.

### Icon sizing

- **Finding** — Lucide icons drawn at three different pixel sizes (14, 16, 20)
  inside buttons depending on which page wrote them.
- **Resolution** — Inline icon usage in prototype pages standardises on
  `width=16 height=16` inside `sm/md` buttons; `Icon size="sm"` (16) inside
  Cluster groups, `Icon size="md"` (20) standalone, `Icon size="xl"` (32) for
  empty-state symbols.
- **Status** — Resolved.

### Button hierarchy

- **Finding** — Several CTAs were defaulting to `primary` even when the page
  already had a primary action above. This created competing dominant
  buttons in the homepage hero and product detail.
- **Resolution** — On any single fold, only **one** `primary` button. Secondary
  flows use `outline`; tertiary / dismissive flows use `ghost` or `link`.
- **Status** — Resolved.

### Form spacing

- **Finding** — Mixed `gap={3}` and `gap={4}` between form rows.
- **Resolution** — Forms now use `Stack gap={4}` between `FormField`s; in-row
  grids use `gap={3}`. Helper/error text relies on `FormField`'s built-in
  `gap-1.5` — no overrides.
- **Status** — Resolved.

### Grid alignment

- **Finding** — Collection page's filter column and product grid were sharing
  the same `<Grid cols={4}>` parent; the filter column was getting unintended
  card spacing.
- **Resolution** — Filter column is `aside` with explicit `lg:col-span-1`, the
  product grid is `section lg:col-span-3` with its own nested `Grid cols={3}`.
  Clear separation of layout and content grids.
- **Status** — Resolved.

### Empty states

- **Finding** — Empty wishlist and empty cart originally used different layouts.
- **Resolution** — Both now use `EmptyState` with consistent icon size,
  title, description, action.
- **Status** — Resolved.

### Loading states

- **Finding** — Skeletons only on the showcase. No loading state for product
  cards or checkout order summary yet.
- **Resolution (deferred)** — Page-level skeletons are a feature-stage concern;
  the component (`Skeleton`) is ready and validated in the showcase. Noted for
  Stage 6+ when real data introduces loading.

### Colour / contrast spot-checks

- Primary `#B81F34` on background `#FEFEFE` → 6.3:1 (AAA for large text, AA
  for normal). ✓
- Body text (`secondary #410C14`) on background → 16:1. ✓
- Muted text (`rgba(65,12,20,0.66)` ≈ `#7B404B` on white) → 5.9:1. ✓
- Small `#B81F34` on dark `#410C14` was previously called out (≈ 2.5:1, fails)
  — never used in prototypes. ✓

## Net assessment

The product reads as one coherent system across every prototype. The remaining
drifts that did surface were all single-page localised choices, fixed in
place. No token additions required.

Recommendation: ship the design system as-is into Stage 4.
