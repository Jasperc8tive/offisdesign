# Responsive Breakpoints — Branch Furniture

> Derived from media-query frequency analysis of `style.css` + `index.html`.

## Observed breakpoints (by usage frequency)

| px          | Hits | Meaning                                |
| ----------- | ---- | -------------------------------------- |
| 599 / 600   | 420+ | **Mobile** upper bound / tablet start  |
| 839 / 840   | ~180 | small-tablet boundary                  |
| 899 / 900   | 409  | **Tablet** upper bound / desktop start |
| 1023 / 1024 | 444  | small-desktop boundary                 |
| 1199 / 1200 | 331  | mid-desktop                            |
| 1120        | 30   | content max-width pin                  |
| 1439 / 1440 | 438  | **Large desktop** boundary             |

## Canonical tiers (rebuild)

| Tier          | Range       | Notes                                                                     |
| ------------- | ----------- | ------------------------------------------------------------------------- |
| Mobile        | ≤ 599px     | full-screen drawer nav, single column, 24px gutters, 60px section padding |
| Tablet        | 600–899px   | 64px gutters, 2-col grids, 80px section padding                           |
| Small desktop | 900–1199px  | mega-menu appears, multi-col grids                                        |
| Desktop       | 1200–1439px | 77.77vw content width                                                     |
| Large desktop | ≥ 1440px    | content pinned to 1120px max                                              |

## Tailwind mapping

```js
screens: { sm: '600px', md: '900px', lg: '1024px', xl: '1200px', '2xl': '1440px' }
```

- Test matrix (per a11y checklist): **375 / 768 / 1024 / 1440**.
- Header switches mobile-drawer → desktop mega-menu at the `md`/`lg` boundary (~900–1024px).
