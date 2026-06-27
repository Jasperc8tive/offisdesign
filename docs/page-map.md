# Page Map — Branch Furniture

> Extracted from internal `href`s in the saved homepage DOM. This is the homepage-visible link
> graph; deeper collection/product pages will reveal more. Counts indicate link prominence.

## Core / functional

- `/` — Homepage
- `/cart` — Cart
- `/search` — Search results / predictive search
- `/account` — Account (sign in / register / dashboard)
- `/pages/quiz` — "Design my office" personalization quiz (very prominent, 30+ links)

## Collections (~57)

**Top-level catalog**

- `/collections/all`, `/collections/new`, `/collections/bestsellers`
- `/collections/office-chairs`, `/collections/seating`, `/collections/performance-chairs`,
  `/collections/active-office-chairs`, `/collections/crossover-chairs`, `/collections/conference`
- `/collections/desks`, `/collections/desks-tables`, `/collections/standing-desks`,
  `/collections/fixed-height-desks`, `/collections/team-desks`, `/collections/tables`
- `/collections/lounge-seating`, `/collections/home-lounge`, `/collections/sofas`
- `/collections/storage`, `/collections/accessories`, `/collections/desk-organization`
- `/collections/power-and-lighting`, `/collections/lighting`, `/collections/monitor-and-laptop-stands`
- `/collections/bundles`, `/collections/ergonomic-bundles`, `/collections/budget-bundles`,
  `/collections/colorful-bundles`, `/collections/design-forward-bundles`
- `/collections/gaming`, `/collections/open-box`, `/collections/upgrade-and-save`,
  `/collections/work-from-home`, `/collections/workstations`

**Curated / persona / material collections**

- `/collections/curated-by-branch`, `/collections/branch-work-system`, `/collections/gather`
- `/collections/for-the-digital-nomad`, `/collections/for-the-minimalist-design-lover`,
  `/collections/for-the-side-quest-gamer`, `/collections/for-the-workout-warrior`,
  `/collections/for-the-cozy-corner-reader`
- `/collections/boucle`, `/collections/velvet`, `/collections/panels`, `/collections/phone-booths`
- `/collections/breakout-and-meeting`, `/collections/collaboration`, `/collections/kitchen-lounge`

## Products (~70+, sample)

`ergonomic-chair`, `ergonomic-chair-pro`, `ergonomic-chair-pro-sega-edition`, `verve-chair`,
`daily-chair`, `softside-chair`, `swivel-chair`, `saddle-chair`, `multitask-chair`,
`conference-chair`, `guest-chair`, `cafe-chair`, `duo-standing-desk`, `double-standing-desk`,
`four-leg-standing-desk`, `standing-desk`, `daily-desk`, `office-desk`, `artisan-desk`,
`quad-desk`, `six-person-desk`, `conference-table`, `meeting-table`, `bistro-table`,
`oppo-lounge-chair`, `lounge-chair`, `focal-sofa`, `modular-sofa`, `sofa`, `desk-riser`,
`desk-riser-shelf`, `desk-drawer`, `desk-perch`, `desk-mat`, `desk-tray`, `desk-hook`,
`monitor-stand`, `adjustable-laptop-stand`, `cable-organizer`, `clamp-on-power`, `alumina-lamp`,
`small-filing-cabinet`, `midi-locker`, `credenza`, `block-trolley`, `gift-card`,
plus open-box & headrest variants.

## CMS pages (`/pages/*`, ~45)

**Brand/editorial:** about-us, design, design-values, our-process, sustainability, media, press,
reviews, projects, resources, personas, shop-by-spaces, plan-your-space
**"Spaces" editorial:** arcade-alcove, bedside-bureau, cozy-corner, midcentury-sanctuary,
organized-oasis, scandinavian-studio, workstations, spec-suites
**Support:** faq, contact, track-my-order, assembly-guides, ergonomics, showrooms, returns,
shipping, shipping-and-delivery-options, warranty, extended-warranty
**B2B:** for-teams, trade, real-estate, startups, fast-furnishing, affiliate-program, referral
**Legal:** terms-conditions, accessibility-statement, your-privacy-choices
**Catalog-as-page:** bundles

## Blog

- `/blogs/turn-key` — "Journal"

## Policies

- `/policies/privacy-policy` (terms/returns/shipping surfaced as `/pages/*`)

## Route taxonomy (for rebuild)

```
/                          home
/collections               index of collections
/collections/[slug]        catalog grid (filter/sort/paginate)
/products/[slug]           product detail (variants, gallery, reviews)
/cart                      cart
/checkout/*                checkout flow
/account/*                 auth + dashboard (orders, addresses)
/pages/[slug]              CMS pages
/blogs/[blog]/[article]    journal
/search                    search results
/pages/quiz                quiz funnel
```
