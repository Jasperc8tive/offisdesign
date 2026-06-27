# Website Architecture — Branch Furniture (Reverse-Engineering Audit)

> Stage 1 deliverable. Source of truth: saved `index.html` (4.3 MB rendered DOM) + `style.css`
>
> - recorded structure videos in `Website Homepage Structure/`. The live site runs on **Shopify**;
>   this document captures _observed behavior only_ — the rebuild uses a fully custom stack (see Stage 2).

## 1. High-level shape

Branch is a **DTC + B2B e-commerce storefront** for ergonomic office furniture. Two audiences are
served from one domain:

- **DTC ("Shop By")** — consumers buying chairs, desks, lounge, storage.
- **Business ("Branch Business")** — teams/offices; quiz-driven discovery, trade/real-estate/startup
  programs, a separate login.

The storefront is content-heavy (editorial "spaces", journal, design-values pages) layered on top of
a standard catalog → product → cart → checkout commerce spine.

## 2. Surface inventory (observed)

| Area                   | Count (observed)                              | Notes                                           |
| ---------------------- | --------------------------------------------- | ----------------------------------------------- |
| Collections            | ~57                                           | catalog grids, many curated/persona collections |
| Products               | ~70+                                          | configurable variants (color/material/size)     |
| CMS pages (`/pages/*`) | ~45                                           | editorial, support, legal, B2B programs         |
| Policies               | privacy (+ terms, returns, shipping as pages) | legal                                           |
| Blog                   | `/blogs/turn-key`                             | "Journal"                                       |
| Functional             | `/cart`, `/search`, `/account`, `/pages/quiz` | commerce + tools                                |

Full enumeration in [page-map.md](page-map.md).

## 3. Rendering & behavior model (observed on live site)

- **Sticky header** with announcement bar above it; condenses on scroll.
- **Mega-menu** on "Shop By" / "Explore" (desktop) — image-rich category panels.
- **Mobile**: full-screen drawer nav (see `header-structure.mp4`, `mobile-hompage-structure.mp4`),
  32px headers / 18px body, light-blue link color `#8DC0D2`.
- **Scroll-reveal animations** everywhere: `data-animate-slide-in` (241×) and `slide-in-zoom` (9×)
  with `data-cascade-order` for staggered entrance.
- **Predictive search** overlay, **cart drawer**, **quiz** personalization, cart-abandonment
  ("your cart is waiting") and recommendation rails.
- **Press/social-proof carousel** (Wired, Forbes, Wirecutter, 600k+ customers, 5,000+ 5-star reviews).

## 4. Homepage section order (observed)

1. Announcement bar (free shipping $90+ / review count)
2. Hero — full-bleed video, "America's Most Loved Office Furniture", Shop now + Take the quiz
3. Press/credibility logo carousel
4. Ergonomic bestsellers rail
5. Business callout / audience switch
6. Recommended products grid
7. Editorial "spaces" / image-text side-by-side blocks
8. Social proof + trust badges
9. Footer (About / Support / Account / Social / country selector)

## 5. Key takeaways for the rebuild

- The catalog is **variant-heavy** → data model must treat product / variant / option / image as
  first-class (see Stage 3 database plan).
- Heavy editorial/CMS surface → needs a real **CMS** with flexible page sections, not hardcoded pages.
- **Two audience contexts** (DTC/Business) → consider an audience flag on navigation + collections.
- Motion is a brand signature (calm, staggered slide-ins) → preserve via a shared reveal primitive.

## Related docs

[page-map.md](page-map.md) · [design-system.md](design-system.md) · [components.md](components.md) ·
[animations.md](animations.md) · [seo.md](seo.md)
