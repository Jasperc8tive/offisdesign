# Responsive Validation (Stage 3.6)

Layouts were reviewed at the design-system breakpoints (`sm` 600, `md` 900,
`lg` 1024, `xl` 1200, `2xl` 1440) plus a 360px floor and a 1920px ultra-wide.

| Bucket                   | Width       |
| ------------------------ | ----------- |
| Mobile                   | 360 – 599   |
| Mobile / tablet boundary | 600 – 899   |
| Tablet                   | 900 – 1023  |
| Laptop                   | 1024 – 1199 |
| Desktop                  | 1200 – 1439 |
| Wide                     | 1440 – 1599 |
| Ultra-wide               | 1600+       |

## Method

Each prototype was opened in the validation environment and inspected at the
seven widths above. Findings recorded below were fixed in source before this
report was written.

## Cross-cutting findings & resolutions

- **Design-shell sidebar** — At `<lg` (i.e. below 1024px) the sidebar nav stacks
  above the main content rather than rendering as a 220-pixel column. The
  Container grid uses `grid-cols-1 lg:grid-cols-[220px_1fr]`. Sticky behaviour
  is `lg`-gated to avoid hijacking mobile scroll. ✓
- **Container gutters** — Inherited from the layout primitive: 24px below `md`,
  64px from `md+`. Verified visually at every width — no clipping or visual
  overflow at 360px.
- **Grid responsive presets** — `Grid cols={4}` collapses 1 → 2 → 4 across
  `sm` / `lg`. `Grid cols={3}` collapses 1 → 2 → 3 across `md` / `lg`. `Grid
cols={2}` collapses 1 → 2 across `md`. Behaves correctly on every page that
  uses them.

## Per-prototype findings

### `/design` index

- Tiles use `Grid cols={3}` — at mobile this collapses to a single column
  stack, which keeps each card large enough for thumb targets. ✓

### `/design/components` showcase

- TOC chips wrap (`Cluster` with `wrap`) cleanly on mobile.
- Section anchor scroll: added `scroll-mt-24` so jump targets land below the
  sticky header.
- Forms section uses `Grid cols={2}` so it collapses to a single column under
  `md` — no horizontal scroll on phones.

### `/design/home`

- Hero copy column has `max-w-prose`; long lines never extend past readable
  width at desktop, and stack naturally on mobile.
- "Shop by room" 4-up grid collapses to 2 cards per row at sm, single card on
  the smallest viewports.
- Featured product grid follows the same cascade.

### `/design/collection`

- Filter sidebar `lg:col-span-1` stacks above the product grid below `lg`,
  matching the e-commerce convention of filters-as-drawer on mobile (real
  drawer wiring deferred to feature stages).
- Active-filter `Tag` cluster wraps on narrow viewports.
- Product grid: `Grid cols={3}` cascades 1 → 2 → 3. Pagination centres
  correctly at every width.

### `/design/product`

- Two-column gallery / details `Grid cols={2}` collapses to a single column at
  the `md` boundary — gallery sits on top, details below, which is the
  expected mobile PDP behaviour.
- Thumbnail strip stays as a 4-up `Grid` under the main image at all widths.
- "You may also like" cascades 1 → 2 → 4 cards.

### `/design/cart`

- Drawer is rendered inline at `max-w-md`; on mobile (360–599) it relaxes to
  the full container width via the parent's own padding. No horizontal
  scroll.

### `/design/checkout`

- Order-summary aside (`lg:col-span-1`) sticks at `lg+`; on smaller widths it
  appears after the form so the primary action is reachable without scrolling
  past a sticky summary.
- Form rows use nested `Grid cols={2}` → collapses to single column under
  `md`. ✓

### `/design/account`

- Avatar + welcome cluster wraps gracefully.
- Order rows use `Cluster wrap` so the action button drops below the meta on
  the narrowest viewports.
- Address grid `Grid cols={2}` collapses to single column under `md`. ✓

### `/design/cms`

- Two-column article + sidebar collapses to a single column under `lg`. Stat
  card grid cascades from 3 → 1.

### `/design/blog`

- Same two-column article shape as CMS; sticky in-article TOC respects the
  `lg+` rule.
- Related-reading grid cascades 1 → 2 → 3.

## Inconsistencies found and fixed

| Where              | Issue                                                                       | Fix                                                                                        |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Showcase TOC       | Anchor scroll lands under sticky header                                     | Added `scroll-mt-24` to each section.                                                      |
| Homepage hero      | Body copy wrapped awkwardly at 1440px                                       | Added `max-w-prose`.                                                                       |
| Collection filters | At `md` (900–1023) filters were rendering 2-up before stacking              | Filters now stay single-column from `md-` and only join the 4-col grid at `lg`.            |
| Cart drawer        | At 360px, the `Quantity` stepper + price could push the row over the gutter | Drawer card centres via the page container, totals row uses `Cluster justify="between"`. ✓ |

## Net assessment

The system is responsive end-to-end at every prototype layout, including the
360px floor and ultra-wide. No breakpoint changes recommended.
