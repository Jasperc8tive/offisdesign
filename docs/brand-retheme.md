# Brand Re-theme — Decision Record & Accessibility Report

> Authored at the Stage 1 → Stage 2 gate. The reference site (branchfurniture.com) remains the
> source for **information architecture, UX, layout, user journey, component structure, feature set,
> motion and interaction patterns**. Its **visual identity is fully retired**; this is our brand.

## Rationale

The reference palette (sage/cream/blue/terracotta) encodes _Branch's_ brand equity, not ours.
Carrying it forward would make the product a clone rather than our own. We adopt a decisive
**crimson + oxblood** identity:

- **Primary `#B81F34` (crimson)** — a single, confident interactive color. One accent for every CTA,
  link, icon, active state and badge keeps the interface legible and the brand memorable.
- **Secondary `#410C14` (oxblood)** — doubles as the text color, so headings, nav, footer and large
  dark blocks share one deep, premium ink. Fewer tokens, stronger cohesion.
- **Accent `#350D13`** — reserved for _structure_ (hover, borders, dividers, inputs, focus, shadows)
  so structural chrome never competes with the crimson call-to-action.
- **Background `#FEFEFE`** — near-white maximizes contrast for the dark ink and lets crimson pop.

Motion, spacing, radii, typography and component structure are **unchanged** — this is a color move
only, executed entirely through tokens.

## Token architecture (single source of truth)

```
packages/ui/src/tokens/
  colors.ts      ← brand hex + derived states (ONLY place hex may live)
  theme.ts       ← aggregate + shadcn HSL channels + cssVars contract
  typography.ts  spacing.ts  radius.ts  shadows.ts  motion.ts
  tokens.css     ← :root CSS variables (brand + --shadcn-*)
  index.ts
packages/config/tailwind-preset.ts  ← bg-primary / text-secondary / border-accent ...
```

Binding rule (to be encoded in Stage 2 `technical-decisions.md` & `frontend-architecture.md`):
**no component hardcodes hex** — colors come only from Tailwind tokens or `var(--*)`, which both
resolve to `colors.ts`. A future ESLint rule should forbid raw hex in `apps/**`.

## Accessibility report (WCAG 2.1)

Contrast computed from sRGB relative luminance.

| Foreground       | Background          | Ratio  | AA normal | AA large | Use             |
| ---------------- | ------------------- | ------ | --------- | -------- | --------------- |
| `#410C14` text   | `#FEFEFE`           | 16.2:1 | ✅ (AAA)  | ✅       | Body, headings  |
| `#350D13` accent | `#FEFEFE`           | 17.0:1 | ✅ (AAA)  | ✅       | Decorative text |
| `#FEFEFE`        | `#B81F34` primary   | 6.3:1  | ✅        | ✅ (AAA) | Button labels   |
| `#B81F34`        | `#FEFEFE`           | 6.3:1  | ✅        | ✅       | Links, icons    |
| `#FEFEFE`        | `#410C14` secondary | 16.2:1 | ✅ (AAA)  | ✅       | Nav/footer text |
| `#FEFEFE`        | `#350D13` accent    | 17.0:1 | ✅ (AAA)  | ✅       | Text on accent  |

**Caveat (documented constraint):** `#B81F34` on `#410C14`/`#350D13` ≈ **2.5:1** — fails for text.
Tokens enforce `--on-dark` (`#FEFEFE`) as the foreground on any dark fill; crimson on dark is allowed
only for large decorative marks, never small text.

Other a11y items unchanged from Stage 1: focus ring uses `--focus-ring` (visible 3px), `prefers-
reduced-motion` honored, 16px mobile body floor, color never the sole signal (icons/labels accompany).

## Quality check

- ✅ No reference-site colors remain in docs or tokens.
- ✅ All color access routed through tokens (colors.ts → tokens.css → Tailwind/shadcn).
- ✅ Tailwind preset, CSS variables and shadcn HSL channels updated.
- ✅ Docs updated: color-system, design-system, components, this record.
- ✅ Accessibility AA verified (table above).
- ✅ Responsive behavior & animations untouched (no code yet; motion tokens preserved).
