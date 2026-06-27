# SEO & Metadata — Branch Furniture (observed + rebuild plan)

## Observed on live site

- Clean, human-readable URL taxonomy: `/collections/<slug>`, `/products/<slug>`, `/pages/<slug>`,
  `/blogs/turn-key/<article>`.
- Rich social proof copy ("America's Most Loved Office Furniture", press logos) — strong for E-E-A-T.
- Editorial "spaces"/journal content drives long-tail/informational SEO.
- Shopify defaults imply: per-page title/description, OG/Twitter tags, product & breadcrumb JSON-LD,
  sitemap.xml, robots.txt, canonical tags. (To be re-implemented natively.)

## Rebuild plan (Next.js App Router)

- **Dynamic metadata** via `generateMetadata` per route (title template, description, canonical).
- **OpenGraph + Twitter Cards** per product/collection/article (dynamic OG images optional).
- **JSON-LD structured data**:
  - `Product` (offers, price, availability, brand, aggregateRating, review)
  - `BreadcrumbList` on all deep pages
  - `Organization` + `WebSite` (with SearchAction) site-wide
  - `Article` on journal posts
  - `FAQPage` on FAQ
- **Canonical URLs** for filtered/sorted collection variants (avoid duplicate-content from facets).
- **sitemap.xml** (dynamic from DB: products, collections, pages, articles) + **robots.txt**.
- Server-render catalog/product/CMS for crawlability; stream where helpful.
- Image alt text from CMS/product data; semantic headings (one H1/page).
- Targets carry into [performance.md] (Core Web Vitals affect ranking).

## Checklist

- [ ] Per-route metadata + canonical
- [ ] OG/Twitter on shareable routes
- [ ] Product/Breadcrumb/Org/Article/FAQ JSON-LD
- [ ] Dynamic sitemap + robots
- [ ] Faceted-URL canonicalization
- [ ] 404 + soft-404 handling
