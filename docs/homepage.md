# Homepage

The production homepage at `apps/web/app/(shop)/page.tsx`. The page itself
is **a server component containing only metadata + section composition** —
all data fetching, optimistic UI, and analytics happen inside the section
components and the providers tree.

## Architecture

```
RootLayout (app/layout.tsx)
   │   sets metadataBase, font CSS vars, WebSite JSON-LD, Providers
   ▼
ShopLayout (app/(shop)/layout.tsx)
   │   AnnouncementBar + Header + main + Footer
   ▼
HomePage (app/(shop)/page.tsx) — server component, exports `metadata`
   │   JsonLd(homepageOrgJsonLd)
   │   Stack:
   ▼
Sections — each is a client component owning its own data + states
   Hero, TrustIndicators, FeaturedCategories, FeaturedCollections,
   FeaturedProducts × 2, BrandStory, PromoBanner, TestimonialsStrip,
   BlogHighlights, Newsletter
```

The architectural rule from the spec is honoured: the page **orchestrates**,
sections **compose**, components **consume hooks**, hooks **consume
services**.

## Sections

Each section is a single file under `apps/web/components/sections/`. They
share these properties:

- Live in `'use client'` modules. They call hooks that hit live APIs.
- Own loading (`Skeleton`), empty (return `null`), and error (return `null`)
  states. No section ever throws into the page.
- Use only design-system primitives. The single new primitive in Stage 9 is
  `<SectionShell>` — a layout helper for eyebrow / title / lead + body. It is
  not a component, just spacing.
- Wired to analytics where the user can act (`cta_click`, `product_click`,
  `nav_clicked`, …).

### Hero

`Hero` consumes the published CMS page with slug `home`. It looks for a
`hero` block in the page's blocks list; if absent (or the CMS page hasn't
shipped yet), it falls back to a sensible default so the homepage is never
blank. The Hero's payload shape is documented inline in `hero.tsx`:

```ts
interface HeroPayload {
  eyebrow?: string;
  display?: string; // Koulen, hero phrase
  title?: string; // Frank Ruhl Libre H1
  lead?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}
```

### Featured categories / collections

Pull from `useCategories()` and `useCollections({ pageSize: 3 })`. Each card
links into the search page with a pre-applied filter so the rest of the
catalogue surfaces immediately after the click.

### Featured products

`<FeaturedProducts title="…" collection="…" sort="…" />` is parametric. The
homepage uses it twice: once for `sort=recent` and once for the
`workspace` collection. Same source, two clear use-cases.

### Trust indicators

Static; no API call. The three brand promises are part of the design
language and don't need to be CMS-editable (yet).

### Brand story + promo banner

Both look for CMS blocks (`brand_story`, `promo_banner`) on the `home` CMS
page. Defaults render when CMS hasn't shipped.

### Blog highlights

`useBlogPosts({ pageSize: 3 })`. Disappears entirely if there are no
published posts.

### Newsletter

`<Newsletter source="homepage_footer" />` posts to
`POST /v1/storefront/marketing/newsletter`. Optimistic feedback on success;
inline `Alert` on `ALREADY_SUBSCRIBED` (409). Analytics fires
`newsletter_subscribed` / `newsletter_subscribe_failed`.

## Performance

- The homepage is a **server component**; its `metadata` is rendered at
  build time. Sections are client components for interactivity.
- Section-level skeletons mean each card group shows progressive structure
  while data loads.
- React Query has `staleTime: 30s` default and 5 min on CMS / categories,
  so navigating away and back is instant.
- Section components return `null` on empty / error states so missing data
  doesn't shift layout.
- The single CMS page lookup (`useCmsPage('home')`) is shared across Hero,
  BrandStory, and PromoBanner via React Query's request dedup — one network
  call serves three sections.
- Fonts loaded with `next/font` (Frank Ruhl Libre, Koulen, Quicksand) with
  `display: 'swap'` so first paint isn't blocked on font fetch.

## SEO

- `metadata` exported from the page sets canonical, OG, Twitter card.
- Root layout sets `metadataBase`, default site name, organisation defaults.
- `Organization` and `WebSite` JSON-LD inlined server-side.
- Sitemap at `/sitemap.xml` pulls product/collection/blog slugs from the API.
- `robots.txt` at `/robots.txt` excludes account, checkout, cart, and the
  `/design` validation env.

## Empty data handling

Every section gracefully degrades:

| Section             | Empty behaviour                           |
| ------------------- | ----------------------------------------- |
| Hero                | Render the default payload                |
| TrustIndicators     | Always renders (static)                   |
| FeaturedCategories  | Returns `null` if no categories           |
| FeaturedCollections | Returns `null` if no collections          |
| FeaturedProducts    | Returns `null` if zero matches            |
| BrandStory          | Render the default payload                |
| PromoBanner         | Returns `null` if title + body empty      |
| TestimonialsStrip   | Returns `null` if no visible testimonials |
| BlogHighlights      | Returns `null` if no published posts      |
| Newsletter          | Always renders                            |

## What didn't change

- Zero new design-system primitives.
- Zero mock data — every section consumes live services.
- No business logic in the page or any section. They consume hooks; hooks
  call typed services; services call the API.
