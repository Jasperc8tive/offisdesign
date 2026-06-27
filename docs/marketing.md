# Marketing

The marketing surface: announcement bar, promo banners, newsletter, trust
indicators, and the analytics event taxonomy that ties them together.

## Components

| Component           | Location                                     | Source of truth                                                     |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `AnnouncementBar`   | `components/chrome/announcement-bar.tsx`     | CMS `Announcement` rows (live-window filtered server-side)          |
| `PromoBanner`       | `components/sections/promo-banner.tsx`       | CMS `promo_banner` block on the `home` page (with default fallback) |
| `TrustIndicators`   | `components/sections/trust-indicators.tsx`   | Static — design language, not editorial copy                        |
| `BrandStory`        | `components/sections/brand-story.tsx`        | CMS `brand_story` block on the `home` page                          |
| `TestimonialsStrip` | `components/sections/testimonials-strip.tsx` | CMS `Testimonial` rows (visible only)                               |
| `BlogHighlights`    | `components/sections/blog-highlights.tsx`    | CMS `BlogPost` (published)                                          |
| `Newsletter`        | `components/sections/newsletter.tsx`         | API: `POST /v1/storefront/marketing/newsletter`                     |

## Newsletter

### Backend

A small marketing module ships in `apps/api/src/marketing/`:

- `NewsletterSubscription` Prisma model — `email` (citext, unique),
  `source`, `referrer`, `consentedAt`, `unsubscribedAt`.
- `MarketingService.subscribe({ email, source?, referrer? })`:
  - New email → insert + emit `newsletter.subscribed` event.
  - Re-subscribe after unsubscribe → clear `unsubscribedAt`, refresh
    `consentedAt`, return `{ resubscribed: true }`.
  - Already subscribed and active → `409 ALREADY_SUBSCRIBED`.
- `MarketingService.unsubscribe(email)` — idempotent; never reveals whether
  the email existed.
- `StorefrontMarketingController` exposes `POST /v1/storefront/marketing/newsletter`
  and `POST /v1/storefront/marketing/newsletter/unsubscribe`.

The `newsletter.subscribed` event is added to `DomainEventMap` so it
auto-eligible for webhook fan-out and audit trails.

### Frontend

- Service: `marketingService.subscribe / unsubscribe` in `lib/api/services/marketing.ts`.
- Hook: `useSubscribeNewsletter()` (mutation).
- Component: `<Newsletter source="…" />` posts on submit, shows a success
  `Alert` or surfaces `ALREADY_SUBSCRIBED` inline.

## Analytics

The frontend ships a small typed analytics surface in
`apps/web/lib/analytics/`:

```ts
type AnalyticsEventMap = {
  page_view: { path: string; title?: string };
  cta_click: { id: string; location: string; href?: string };
  newsletter_subscribed: { source: string };
  newsletter_subscribe_failed: { source: string; code: string };
  product_click: { productId: string; slug: string; location: string };
  collection_click: { collectionId: string; slug: string; location: string };
  search_submitted: { q: string };
  search_filter_changed: { facet: string; value: string };
  search_paginated: { page: number };
  nav_clicked: { label: string; href: string; surface: 'header' | 'mobile' | 'footer' };
  cart_opened: { trigger: 'header' | 'auto' };
  cart_item_added: { variantId: string; productSlug?: string };
};
```

- `AnalyticsProvider` lives at the providers root.
- `useAnalytics().track(name, payload)` dispatches to every configured sink.
- The default sink writes to the dev console only. Bind GA4 / Plausible /
  PostHog / a server collector by implementing the `AnalyticsSink` interface
  and passing it via the provider's `sinks` prop.
- Each sink's failure is isolated; one collector going down never breaks
  the page or other sinks.
- Every envelope carries a UUID `sessionId` generated client-side per page
  load. Server-side IDs are out of scope for Stage 9 — when needed, replace
  the in-memory ref with a value hydrated from a cookie.

### Where events fire

- `nav_clicked` — header, mobile, footer link clicks.
- `cta_click` — announcement bar, hero, promo banner, brand story, blog card.
- `product_click` — every product card on the home / search / autocomplete.
- `collection_click` — collection and category cards on home.
- `search_submitted` — search overlay form submit.
- `cart_opened` — when the header cart icon opens the drawer.
- `cart_item_added` — handled by the PDP and add-to-cart actions.
- `newsletter_subscribed` / `newsletter_subscribe_failed` — newsletter form.
- `page_view` — `usePageView(path)` is available for per-page emission.

## Empty-state contract

Every marketing component returns `null` when CMS data is empty, except:

- `AnnouncementBar` — returns `null` (the bar disappears).
- `Newsletter` and `TrustIndicators` — always render (no empty case).
- `Hero`, `BrandStory`, `PromoBanner` — render their defaults so a fresh
  deploy without CMS content is still presentable.

## Architectural rule

> CMS controls all editable marketing content; analytics is an abstraction
> that any provider can plug behind.

No marketing copy is duplicated between the design system and the section
components. Strings shipped today are either:

- Hard-coded in the section as a fallback for first-deploy (matches
  brand voice), or
- Pulled from CMS at render time.

Replacing a fallback with CMS content is a no-code action by an editor: add
the matching block to the `home` CMS page and the section picks it up
within the 5-minute stale window.
