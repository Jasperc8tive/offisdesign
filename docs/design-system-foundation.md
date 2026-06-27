# Design System Foundation (Stage 3.5b)

The foundational layer of the Offisdesign design system. Tokens, theme, Tailwind
integration, and the primitives every higher-level component will compose from.

> Stage 3.5b deliberately ships **no commerce components, no navigation, no
> forms, and no page-specific UI.** Those arrive in Stage 3.5c.

---

## 1. Layout

- `packages/ui/src/tokens/` — design tokens (TS, the canonical source of truth).
- `packages/ui/src/tokens/tokens.css` — CSS variable contract written into `:root`.
- `packages/ui/src/theme/` — `ThemeProvider`, `useTheme`.
- `packages/ui/src/typography/` — `Heading`, `Text`, `Display`.
- `packages/ui/src/icon/` — `Icon` (Lucide wrapper).
- `packages/ui/src/layout/` — `Container`, `Stack`, `Cluster`, `Grid`, `Box`,
  `Spacer`, `AspectRatio`, `VisuallyHidden`, `Divider`.
- `packages/config/src/tailwind-preset.ts` — shared Tailwind preset that maps
  every utility back to the token layer.

---

## 2. Tokens

| Group       | File             | Purpose                                                               |
| ----------- | ---------------- | --------------------------------------------------------------------- |
| Colors      | `colors.ts`      | Brand palette + derived states. **Only file allowed to contain hex.** |
| Typography  | `typography.ts`  | Font families, weights, sizes, line heights.                          |
| Spacing     | `spacing.ts`     | 4px base scale + layout constants.                                    |
| Radius      | `radius.ts`      | Corner radii (buttons/inputs = 4px).                                  |
| Shadows     | `shadows.ts`     | Tinted with `#350D13`, never neutral black.                           |
| Motion      | `motion.ts`      | Duration, easing, scroll-reveal cascade.                              |
| Breakpoints | `breakpoints.ts` | 600 / 900 / 1024 / 1200 / 1440.                                       |
| Z-index     | `z-index.ts`     | Discrete stacking bands.                                              |
| Theme       | `theme.ts`       | Aggregate object + shadcn HSL channels + CSS-var map.                 |

### Hex rule

`colors.ts` is the only file allowed to contain raw hex. Everything downstream
— components, CSS, Tailwind utilities — must consume tokens, Tailwind classes,
or `var(--*)`.

---

## 3. Theme

```tsx
import { ThemeProvider, useTheme } from '@offisdesign/ui';

<ThemeProvider theme="light">
  <App />
</ThemeProvider>;
```

- Only `light` is implemented at Stage 3.5b. `dark` is reserved.
- Wraps children in a `data-theme` div with the brand body class.
- `useTheme()` returns `{ theme, name }` for code that needs token values at
  runtime (Framer Motion, canvas, JS-driven styles).

---

## 4. Tailwind integration

Apps and `packages/ui` extend the shared preset:

```ts
// app/admin tailwind.config.ts
import preset from '@offisdesign/config/tailwind-preset';
export default { presets: [preset], content: [...] };
```

Available utility categories:

- **Colors** — `bg-primary`, `text-secondary`, `border-accent`, `bg-primary-subtle`,
  `text-muted`, `text-on-dark`, `border-border`, `border-border-strong`.
- **Fonts** — `font-heading`, `font-display`, `font-body`.
- **Type scale** — `text-h1` … `text-h4`, `text-body`, `text-body-sm`,
  `text-caption`, `text-display-{sm,md,lg}`.
- **Radius** — `rounded-{sm,md,lg,xl}`.
- **Shadows** — `shadow-{sm,md,lg,xl,focus}`.
- **Screens** — `sm:` `md:` `lg:` `xl:` `2xl:` (600/900/1024/1200/1440).
- **Motion** — `duration-{fast,base,slow}`, `ease-{standard,enter,exit}`.
- **z-index** — `z-{dropdown,sticky,overlay,modal,popover,toast,tooltip}`.
- **Container** — `max-w-container` (1120px).

---

## 5. Motion tokens

```ts
import { motion } from '@offisdesign/ui';
motion.duration.base; // 250
motion.easing.standard; // 'cubic-bezier(0.4, 0, 0.2, 1)'
motion.reveal; // { distance, stagger, duration, ease } for Framer Motion
```

Tailwind utilities `transition duration-base ease-standard` produce identical
output.

---

## 6. Typography

```tsx
<Heading level={1}>Page title</Heading>
<Heading level={2} as="h1">Visual H2 / semantic H1</Heading>
<Text>Body copy.</Text>
<Text size="sm" tone="muted">Helper text.</Text>
<Display size="lg">BRAND</Display>
```

- Headings render `<h1>`–`<h4>` with `font-heading` (Frank Ruhl Libre) at the
  Stage 1 scale; H1 steps down on small screens.
- `Text` supports `size: body | sm | caption`, `tone: default | muted | inverse
| primary`, and four weights.
- `Display` is Koulen, uppercased, used sparingly for hero moments.

### Font loading

Fonts are loaded by the consuming app (Next `next/font` recommended). The UI
package only references font families by name and trusts the host to load
`Frank Ruhl Libre`, `Koulen`, and `Quicksand`.

---

## 7. Icon system

```tsx
import { Icon } from '@offisdesign/ui';
import { ShoppingBag } from 'lucide-react';

<Icon icon={ShoppingBag} title="Cart" size="md" />
<Icon icon={ShoppingBag} decorative />
```

- Wraps any Lucide icon. Sizes: `xs` 12, `sm` 16, `md` 20 (default), `lg` 24,
  `xl` 32.
- `title` exposes `role="img"` + `aria-label`. `decorative` switches to
  `aria-hidden` — never leave an icon ambiguous.
- Inherits `currentColor` so tone is controlled by the parent text color.

---

## 8. Layout primitives

| Component        | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `Container`      | 1120px max-width, gutters at 24/64px, polymorphic `as`.   |
| `Stack`          | Vertical flex with token gaps.                            |
| `Cluster`        | Horizontal wrapping flex (toolbars, chip rows).           |
| `Grid`           | Responsive CSS grid presets (1/2/3/4/6/12 cols).          |
| `Box`            | Polymorphic null primitive — last resort.                 |
| `Spacer`         | Explicit gap when flex gaps aren't usable.                |
| `AspectRatio`    | Aspect-ratio frame for media.                             |
| `VisuallyHidden` | Screen-reader-only text.                                  |
| `Divider`        | Hairline, horizontal or vertical, decorative or semantic. |

All primitives forward refs, accept `className` for escape-hatch styling, and
restrict their token surface so usage stays consistent.

---

## 9. Storybook

Run from the repo root:

```bash
pnpm storybook        # dev
pnpm storybook:build  # static build
```

Stories are organised under **Foundation/**:

- `Foundation/Tokens/{Colors, Spacing, Radius, Shadows, Motion, Breakpoints}`
- `Foundation/Theme`
- `Foundation/Typography`
- `Foundation/Icon`
- `Foundation/Layout`

`@storybook/addon-a11y` runs axe on every story; the design system must pass
WCAG AA.

---

## 10. Out of scope (Stage 3.5b)

- Commerce components (cards, prices, swatches, badges).
- Navigation (header, footer, mega menu, breadcrumbs).
- Forms (inputs, selects, validation surfaces).
- Page-specific UI (hero, banner, testimonial, etc.).

Those land in Stage 3.5c, built on this foundation.
