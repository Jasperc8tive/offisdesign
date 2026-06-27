# Design System — Branch Furniture (consolidated)

> The brand's design language, reverse-engineered from `style.css`. Detailed breakdowns live in
> [color-system.md](color-system.md), [typography.md](typography.md), [spacing-system.md](spacing-system.md),
> [animations.md](animations.md). This file is the at-a-glance summary + design thesis.

## Design thesis

We keep the reference site's **structural** identity — calm, considered ergonomics, generous
whitespace, sharp 4px radii, editorial serif-over-rounded-sans pairing, gentle staggered
scroll-reveals — but the **visual brand is now our own**. A confident **crimson `#B81F34`** drives all
interactivity against a clean near-white `#FEFEFE`, with **deep oxblood `#410C14`** for headings,
navigation, footer and large dark blocks, and a near-black **`#350D13`** for structure (borders,
hover, inputs, focus, shadows). The result reads as warm, premium, and decisive rather than soft DTC.
Motion, layout, IA and component structure are unchanged — only color moved to the brand tokens.

## Tokens at a glance

| Axis                  | Value                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| Primary (interactive) | `#B81F34` crimson — CTAs, links, icons, active, badges                |
| Secondary             | `#410C14` oxblood — headings, nav, footer, dark blocks, cards, titles |
| Accent (structural)   | `#350D13` — hover, borders, dividers, inputs, focus, shadows          |
| Background            | `#FEFEFE` — pages, sections, forms, cards, containers                 |
| Text                  | `#410C14`                                                             |
| Muted                 | `rgba(65,12,20,.66)`                                                  |
| On-dark fg            | `#FEFEFE`                                                             |
| Headings              | Frank Ruhl Libre (serif)                                              |
| Display               | Koulen                                                                |
| Body/UI               | Quicksand                                                             |
| Type scale            | H1 60/54/42 → body 14, with 20/16/14/12 body steps                    |
| Base unit             | 4px; spacing 8→256                                                    |
| Radii                 | 4 / 8 / 12 / 16 / full; buttons & inputs = 4px                        |
| Container             | 1120px max (77.77vw); gutters 24 (mobile) / 64 (tablet)               |
| Section rhythm        | 60px mobile / 80px tablet+                                            |
| Motion                | slide-in + cascade stagger, ~.25s ease-in-out                         |

## Components

See [components.md](components.md) for the full inventory and reuse strategy.

## Rebuild config seeds

- Single source of truth: [`packages/ui/src/tokens/`](../packages/ui/src/tokens/) (colors, theme,
  spacing, radius, shadows, typography, motion) → CSS vars in `tokens.css`.
- Tailwind theme: extends [`packages/config/tailwind-preset.ts`](../packages/config/tailwind-preset.ts)
  — `bg-primary`, `text-secondary`, `border-accent`, `bg-background`.
- shadcn/ui themed to `#B81F34` primary + 4px radius via `--shadcn-*` HSL channels.
- Shared `<Reveal>` motion primitive honoring `prefers-reduced-motion` (timing unchanged).

## Anti-patterns to avoid (from a11y/UX rules)

- **No hardcoded hex** — consume tokens/Tailwind classes only.
- No emoji icons — use Lucide SVG.
- Body text not below 16px on mobile despite brand 14px default.
- Hover states via color/shadow, not layout-shifting scale.
- Don't place small `#B81F34` text on `#410C14`/`#350D13` fills (≈2.5:1, fails) — use `#FEFEFE`.
