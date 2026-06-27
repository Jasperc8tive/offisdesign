# Spacing, Radius & Layout System — Branch Furniture

> Extracted from `style.css`. Spacing is a **4px base-unit** scale (`--lm--base-unit`).

## Spacing scale (4px base)

| Token             | Multiplier | px      |
| ----------------- | ---------- | ------- |
| spacing-0         | 0          | 0       |
| spacing-50        | 2×         | 8       |
| spacing-100       | 4×         | 16      |
| spacing-150       | 6×         | 24      |
| spacing-200       | 8×         | 32      |
| spacing-300       | 12×        | 48      |
| spacing-400       | 16×        | 64      |
| spacing-500       | 20×        | 80      |
| spacing-600       | 24×        | 96      |
| spacing-700       | 28×        | 112     |
| spacing-800       | 32×        | 128     |
| spacing-900       | 36×        | 144     |
| spacing-1000–1600 | 40×–64×    | 160–256 |

> Maps cleanly onto Tailwind's default 4px scale (`p-2`=8, `p-4`=16, `p-8`=32 …).

## Radius scale

| Token       | px           |
| ----------- | ------------ |
| radius-100  | 4            |
| radius-200  | 8            |
| radius-300  | 12           |
| radius-400  | 16           |
| radius-full | 9999 (pills) |

- Buttons: `--lm--button-radius` → radius-100 (4px) by default.
- Inputs: `--lm--field-radius` → radius-100 (4px).
- Banners: radius-200 (8px).

## Layout / container

| Token                         | Value                                                |
| ----------------------------- | ---------------------------------------------------- |
| Desktop content max-width     | `77.77%` (`--desktop-content-max-width-vw: 77.77vw`) |
| Large-desktop max-width       | `1120px`                                             |
| Mobile content margin (L/R)   | `24px`                                               |
| Tablet content margin (L/R)   | `64px`                                               |
| Mobile section padding (T/B)  | `60px`                                               |
| Tablet+ section padding (T/B) | `80px`                                               |

## Component spacing

- Button internal spacing: `--lm--button-spacing` → spacing-400 (64) token family (component-scoped).

## Rebuild notes

- Container: `max-w-[1120px]` with responsive horizontal padding (`px-6` mobile / `px-16` tablet).
- Section rhythm: `py-[60px] md:py-20`.
- Standardize radii to {4, 8, 12, 16, full}; buttons/inputs = 4px (sharp, considered look).
