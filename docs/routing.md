# Routing Map — Rebuild (Next.js App Router)

> Mirrors observed Branch URL taxonomy ([page-map.md](page-map.md)) on a custom Next.js stack.
> URLs kept identical to the live site to preserve SEO equity and user familiarity.

## Public storefront (`apps/web`)

```
app/
  (storefront)/
    page.tsx                         /                     Home (RSC, streamed rails)
    collections/page.tsx             /collections          Collections index
    collections/[slug]/page.tsx      /collections/:slug    Catalog grid (?sort=&filter=&page=)
    products/[slug]/page.tsx         /products/:slug       PDP (variants, gallery, reviews)
    pages/[slug]/page.tsx            /pages/:slug          CMS page (section-block renderer)
    blogs/[blog]/page.tsx            /blogs/:blog          Journal index
    blogs/[blog]/[article]/page.tsx  /blogs/:blog/:article Article
    search/page.tsx                  /search               Search results
    pages/quiz/page.tsx              /pages/quiz           Quiz funnel
    cart/page.tsx                    /cart                 Cart (drawer is global overlay)
  (checkout)/
    checkout/...                     /checkout/*           Multi-step checkout
  (account)/
    account/...                      /account/*            Login/register/reset, orders, addresses
  not-found.tsx                      404
  sitemap.ts, robots.ts             SEO
```

## Conventions

- **Server Components** for catalog/PDP/CMS (SEO + TTFB); client islands for cart, search overlay,
  variant selector, quiz.
- Collection facets are **query params** with canonical tags (see [seo.md](seo.md)).
- Global overlays (CartDrawer, SearchOverlay, MobileNav) mounted in root layout, state via Zustand
  or React context; server data via TanStack Query against the NestJS API.
- Admin lives in a separate app (`apps/admin`) — routing documented in Stage 2.

## API surface (consumed)

REST under `/api/v1/*` (NestJS) — products, collections, cart, checkout, auth, account, search,
content/pages, reviews, newsletter. Full contract = Stage 2/4 (`api-analysis.md`, `backend-architecture.md`).
