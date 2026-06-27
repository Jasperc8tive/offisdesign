# Typography — Branch Furniture

> Extracted from `style.css` / `index.html` (`@font-face` + CSS variables).

## Font families (real)

| Token                          | Family                      | Use                            | Source          |
| ------------------------------ | --------------------------- | ------------------------------ | --------------- |
| `--font-family-header`         | **Frank Ruhl Libre**, serif | H1–H6 headings                 | Google Fonts    |
| `--font-family-header-special` | **Koulen**, sans            | Display / oversized statements | self-hosted TTF |
| `--font-family-body`           | **Quicksand**, sans-serif   | Body, UI, nav, prices          | Google Fonts    |
| `GTStandard-M`                 | GT Standard (licensed)      | some legacy blocks             | self-hosted     |

The pairing — a **humanist serif** (Frank Ruhl Libre) for headings over a **rounded geometric sans**
(Quicksand) for body — is the typographic signature: editorial warmth + soft, approachable UI.
Koulen provides occasional bold display punctuation.

## Type scale (px)

| Level | Desktop | Tablet | Mobile |
| ----- | ------- | ------ | ------ |
| H1    | 60      | 54     | 42     |
| H2    | 40      | 36     | 28     |
| H3    | 32      | 28     | 24     |
| H4    | 26      | 22     | 20     |
| H5    | 20      | 18     | 16     |
| H6    | 16      | 14     | 12     |

## Body scale

| Token   | Size                  |
| ------- | --------------------- |
| body-xl | 20px                  |
| body-l  | 16px                  |
| body-m  | 14px (default `body`) |
| body-s  | 12px                  |

## Other

- Mobile menu: header 32px / weight 700; body 18px / weight 400; line-height 140%.
- `font-feature-settings: "lnum"` (lining numerals — important for prices).
- `-webkit-font-smoothing: antialiased`.

## Rebuild notes

- Load Frank Ruhl Libre + Quicksand via `next/font` (self-host for CLS/perf). Self-host Koulen.
- Tailwind: `fontFamily: { head: ['Frank Ruhl Libre','serif'], body: ['Quicksand','sans-serif'], display: ['Koulen','sans-serif'] }`.
- Enable `lnum` font-feature on price components.
- Default body 14px is small for mobile readability — bump body to 16px min on mobile per a11y
  (`readable-font-size`) while keeping the brand scale for headings.
