# UI Showcase

The Stage 3.6 validation environment is a `(design)` route group inside
`apps/web`. It does not ship to production. Run `pnpm --filter @offisdesign/web
dev` and open `http://localhost:3000/design` to explore.

## Routes

| Route                | Purpose                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| `/design`            | Index — tiles linking to every demo.                                              |
| `/design/components` | UI Showcase — every reusable component on one scrollable page with a section TOC. |
| `/design/home`       | Homepage layout prototype.                                                        |
| `/design/collection` | Collection listing prototype (filters, sort, grid, pagination).                   |
| `/design/product`    | Product detail prototype (gallery, options, tabs, related).                       |
| `/design/cart`       | Cart drawer prototype (line items, totals).                                       |
| `/design/checkout`   | Checkout prototype (shipping address, method, order summary).                     |
| `/design/account`    | Account dashboard prototype (orders, addresses, wishlist, preferences).           |
| `/design/cms`        | Long-form CMS / brand story page prototype.                                       |
| `/design/blog`       | Journal article prototype (TOC, author, related).                                 |

## Shared chrome

`apps/web/app/(design)/layout.tsx` provides:

- Skip-to-content link (visible on focus).
- Sticky header landmark with the brand mark and "validation environment" hint.
- Sidebar `<aside>` with a section-grouped link list (visible at `lg+`,
  collapses above the content on smaller viewports).
- `<main id="main">` content slot.

## Component coverage

The `/design/components` showcase renders, in order:

- **Typography** — `Display`, `Heading 1–4`, `Text` (body, sm, caption).
- **Layout primitives** — `Container`, `Grid`, `Stack`, `Cluster`, `Divider`,
  `AspectRatio`, `Tag` (used as filter chip).
- **Atomics** — `Button` (5 variants + sizes + loading/leading/trailing/disabled),
  `Badge` (4 variants), `Avatar`, `Card` family, `Skeleton`.
- **Navigation** — `NavLink`, `Breadcrumb`, `Tabs`, `Pagination`.
- **Commerce** — `PriceTag` (sale & sizes), `Quantity`, `Rating`, `Swatch`.
- **Forms** — `Input` (default, with leading icon, invalid), `Textarea`,
  `Select`, `Checkbox`, `Radio` group, `Switch`, all composed with `FormField`.
- **Feedback** — `Alert` (info/success/warning/error), `Tooltip`, `Spinner`,
  `Progress`, `EmptyState`.

Quick-jump anchors at the top of the showcase let designers cite e.g.
`/design/components#commerce` in review notes.

## Motion

`apps/web/app/(design)/_lib/Reveal.tsx` is a thin Framer Motion wrapper that
reads `motion.reveal` tokens from `@offisdesign/ui` and **respects
`prefers-reduced-motion`** by skipping the animation entirely. It is the only
place page-level motion is defined for prototypes; component-level transitions
flow through Tailwind utilities (`duration-base ease-standard`) that map to the
same tokens. Reduced-motion is also enforced globally by a `globals.css` block
that flattens all animation/transition durations to `0.001ms`.

## What this environment is _not_

- Not a production app — there is no router redirect, no analytics, no SEO.
- Not connected to data — every list is hard-coded sample content.
- Not a substitute for Storybook — Storybook is for component-in-isolation
  documentation; the showcase is for component-in-composition validation.
