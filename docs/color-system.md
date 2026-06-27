# Color System — Brand Re-theme

> **Brand palette adopted pre-Stage 2.** The reference site (branchfurniture.com) is used only for
> IA / UX / layout / motion / components. Its sage/cream/blue/terracotta palette has been **fully
> retired** and replaced with our own brand identity below. Tokens live in
> [`packages/ui/src/tokens/colors.ts`](../packages/ui/src/tokens/colors.ts) — the single source of
> truth. No component may hardcode a hex.

## Brand palette

| Token          | Hex       | Role                                                                                                 |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `--primary`    | `#B81F34` | Primary CTAs, active states, links, icons, product highlights, badges, interactive elements          |
| `--secondary`  | `#410C14` | Headings, navigation, footer, large dark background blocks, cards, product titles                    |
| `--accent`     | `#350D13` | Hover states, borders, dividers, secondary buttons, inputs, focus states, shadows, decorative shapes |
| `--background` | `#FEFEFE` | Page / section / form / card / container surfaces                                                    |
| `--text`       | `#410C14` | Primary body copy                                                                                    |

## Derived states (computed, in `colors.ts`)

These keep interactions inside the brand family — components never improvise colors.

| Token              | Value                 | Use                                          |
| ------------------ | --------------------- | -------------------------------------------- |
| `--primary-hover`  | `#A01B2D`             | Primary CTA hover                            |
| `--primary-active` | `#8A1727`             | Primary pressed                              |
| `--primary-subtle` | `rgba(184,31,52,.08)` | Hover backgrounds, selected rows             |
| `--focus-ring`     | `rgba(184,31,52,.45)` | Visible focus ring                           |
| `--border`         | `rgba(65,12,20,.14)`  | Hairline borders/dividers                    |
| `--border-strong`  | `rgba(65,12,20,.28)`  | Inputs, focus-within                         |
| `--muted`          | `rgba(65,12,20,.66)`  | Secondary/muted text on background           |
| `--on-dark`        | `#FEFEFE`             | Foreground on primary/secondary/accent fills |

## Usage rules

- **Background is `#FEFEFE`** everywhere — pages, forms, cards, containers.
- **Text/headings use `#410C14`** (secondary == text); headings/nav/footer lean on secondary blocks.
- **Primary `#B81F34`** carries all interactivity: CTAs, links, icons, active states, badges.
- **Accent `#350D13`** is structural/decorative: hover, borders, dividers, inputs, focus, shadows.
- **Foreground on any dark fill = `#FEFEFE`** (`--on-dark`). Do **not** put small `#B81F34` text on a
  `#410C14`/`#350D13` block (≈2.5:1 — fails); use it only for large/decorative marks there.

## Accessibility (WCAG AA — verified, see [accessibility report](brand-retheme.md#accessibility-report))

| Pair                                  | Ratio      | Verdict        |
| ------------------------------------- | ---------- | -------------- |
| `#410C14` text on `#FEFEFE`           | **16.2:1** | AAA            |
| `#350D13` on `#FEFEFE`                | **17.0:1** | AAA            |
| `#FEFEFE` on `#B81F34` (button label) | **6.3:1**  | AA (AAA large) |
| `#B81F34` link on `#FEFEFE`           | **6.3:1**  | AA             |
| `#FEFEFE` on `#410C14` (nav/footer)   | **16.2:1** | AAA            |

## Tailwind / CSS / shadcn consumption

- Tailwind: `bg-primary`, `text-secondary`, `border-accent`, `bg-background` — see
  [`packages/config/tailwind-preset.ts`](../packages/config/tailwind-preset.ts).
- CSS variables: [`packages/ui/src/tokens/tokens.css`](../packages/ui/src/tokens/tokens.css).
- shadcn HSL channels: `theme.ts` → `shadcnHsl` + `--shadcn-*` in `tokens.css`.
