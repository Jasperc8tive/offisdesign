# Performance

Stage 12 performance posture for the Offisdesign storefront. This document is the source-of-truth for budget, current state, and recommendations.

## Targets (Core Web Vitals)

| Metric     | Target   | Enforced by                                        |
| ---------- | -------- | -------------------------------------------------- |
| LCP        | ≤ 2.5 s  | Lighthouse CI `largest-contentful-paint` (`error`) |
| CLS        | ≤ 0.1    | Lighthouse CI `cumulative-layout-shift` (`error`)  |
| INP        | ≤ 200 ms | Lighthouse CI `interaction-to-next-paint` (`warn`) |
| FCP        | ≤ 1.8 s  | Lighthouse CI `first-contentful-paint` (`warn`)    |
| TBT        | ≤ 200 ms | Lighthouse CI `total-blocking-time` (`warn`)       |
| Perf score | ≥ 95     | Lighthouse CI `categories:performance` (`error`)   |

Routes audited each CI run: `/`, `/search`, `/cart`, `/account/login`, `/account/register`. Configuration in `apps/web/lighthouserc.cjs`.

## Rendering strategy

The App Router is used with a mix of server and client components:

- **Server components by default.** Pages only mark `'use client'` when they need React state or browser APIs. The home page, sitemap, robots, and SEO metadata all run server-side.
- **Per-route `generateMetadata`** is implemented on `/products/[slug]` and `/collections/[slug]` (via sibling `layout.tsx`) so search engines and social embeds see per-resource titles, descriptions, and OG cards without a client round-trip.
- **Streaming + Suspense** boundaries via `<AsyncBoundary>` (`lib/ux/async-boundary.tsx`) wrap individual sections that depend on async queries, so a slow query never blocks the surrounding chrome.
- **Route-level fallbacks** — `app/(shop)/loading.tsx`, `error.tsx`, and `not-found.tsx` give the App Router something to render while server work is in flight.

## Media pipeline

- `next/image` is used for all product photography. Configured in `next.config.mjs` with AVIF + WebP formats, an explicit device-size ladder, and remote-pattern allow-list for CDN hosts.
- The PDP gallery (`components/pdp/gallery.tsx`) marks the active image `priority` and supplies a blur placeholder so it lands within the LCP budget.
- Thumbnails use lazy loading and `sizes` hints tuned for the 4-up grid.
- Above-the-fold imagery should ship a real CMS-supplied `blurDataURL` (pre-computed at upload time) — the default neutral SVG is a fallback.

## Bundle and code splitting

- `transpilePackages: ['@offisdesign/ui', '@offisdesign/utils']` keeps the workspace packages in the same module graph as the app so dead-code elimination works through workspace boundaries.
- Stripe is only loaded inside `<PaymentStep>`, which is itself behind a conditional render gate. The Stripe runtime never ships to non-checkout routes.
- `lib/observability/error-reporter.ts` defaults to a console sink — the Sentry SDK (or alternative) is only loaded when an integration is installed at boot.

## React Query strategy

- A single `QueryClient` is provided by `lib/providers/query.provider.tsx`. Default `staleTime` is conservative (30 s for most queries) so navigation rarely triggers an immediate refetch.
- Cart, wishlist, and customer-me queries invalidate on the matching mutation's `onSuccess`. Optimistic updates land via `queryClient.setQueryData` before the network round-trip completes.
- The product catalogue is the right candidate for `<HydrationBoundary>` server prefetch in Stage 13 — that's tracked under "Open recommendations" below.

## Fonts

Brand fonts are loaded via `next/font` (see Stage 8 design-system docs). `font-display: swap` is set so initial paint is never blocked by font fetch. Local subsetting keeps the payload below 30 KB per family.

## Open recommendations

1. **Server-side prefetch on PDP and collection pages.** Wrap the React Query queries in `HydrationBoundary` so the first paint already has product/collection data — currently both routes hydrate then fetch.
2. **Image derivative generation pipeline.** Stage 10's media controller accepts uploads but does not yet emit pre-resized derivatives. Wire ImageMagick/Sharp into the upload queue and persist `blurDataURL` per asset.
3. **Partial Prerendering (PPR).** Next.js PPR is still experimental; track upstream and adopt once stable for the homepage and collection listings.
4. **CDN-fronted media.** Configure `NEXT_PUBLIC_MEDIA_HOSTNAME` against a CDN once one is provisioned; `next.config.mjs` already accepts it.
5. **Tree-shake `lucide-react`.** Verify the bundle uses per-icon imports so the storefront only ships the icons it actually renders.
