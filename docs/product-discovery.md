# Product Discovery

Three discovery surfaces share the same engine — the catalog API, the
`<FilterSidebar>`, the `<ProductGrid>`, and a centralised URL filter
serializer. Adding a new discovery surface is a 30-line composition.

## Surfaces

| URL                   | File                                     | Pre-applied scope     |
| --------------------- | ---------------------------------------- | --------------------- |
| `/search`             | `app/(shop)/search/page.tsx`             | none — full catalogue |
| `/collections/[slug]` | `app/(shop)/collections/[slug]/page.tsx` | `collection=<slug>`   |
| `/c/[slug]`           | `app/(shop)/c/[slug]/page.tsx`           | `category=<slug>`     |
| `/t/[slug]`           | `app/(shop)/t/[slug]/page.tsx`           | `tag=<slug>`          |

Each page:

1. Reads URL state through `parseFilters(URLSearchParams)`.
2. Calls `useSearch(filters)` with its pre-applied scope merged in.
3. Renders `<FilterSidebar>` (hiding the pre-applied facet) and
   `<ProductGrid>`.
4. Pushes a fresh URL on every filter / sort / page change through
   `serializeFilters` — so back/forward navigation restores the exact view.

## URL filter contract

`apps/web/lib/filters/url.ts` is the single source of truth.

```ts
interface DiscoveryFilters {
  q?: string;
  collection?: string[]; // multi-select
  category?: string[]; // multi-select
  tag?: string[]; // multi-select
  priceMin?: number; // minor units
  priceMax?: number; // minor units
  sort?: 'relevance' | 'recent' | 'price-asc' | 'price-desc';
  page?: number; // 1-indexed; omitted when 1
}
```

- `serializeFilters` drops fields that are empty, zero-equivalent, or
  redundant (page=1 → no `page` param). The URL stays as short as possible.
- `parseFilters` rejects malformed numeric values, unknown sort values,
  and negative numbers — so a malicious URL can't poke a non-existent enum.
- `toggleArrayFilter` is the canonical way to flip a facet on/off; it always
  resets `page` so pagination doesn't dangle on a stale page that no longer
  has enough hits.

## Listing primitives

- `<ProductCard>` (`components/listing/product-card.tsx`) — the atomic card
  used across all four discovery surfaces, the homepage's featured products,
  and the PDP's recommendations. Always emits a `product_click` analytics
  event with the calling `location`.
- `<ProductGrid>` — wraps `<ProductCard>` with shared loading / empty /
  error states. Skeleton count and column count are parametric.
- `<FilterSidebar>` — renders one facet group per non-empty facet from the
  search response. Emits `search_filter_changed` analytics with
  `{ facet, value }` whenever a chip is clicked.

## Empty / error UX

- Loading → `Skeleton` cards from the design system.
- Empty (zero hits) → `<EmptyResult>` (`AsyncBoundary` helper from Stage 8).
- Error → `<EmptyResult>` with a "Try refreshing" message.
- No facets returned → the corresponding section hides itself.

## Analytics events

| Event                                               | Where                                                  |
| --------------------------------------------------- | ------------------------------------------------------ |
| `search_submitted { q }`                            | search bar submit, search overlay, recent search click |
| `search_filter_changed { facet, value }`            | every facet click in the sidebar                       |
| `search_paginated { page }`                         | pagination control                                     |
| `product_click { productId, slug, location }`       | every `<ProductCard>`                                  |
| `collection_click { collectionId, slug, location }` | homepage collection / category cards                   |
| `page_view { path }`                                | each discovery page calls `usePageView(pathname)`      |

## Performance

- The shared search query key (`['search','results', params]`) means
  navigating from `/collections/sofas` back to `/search?collection=sofas`
  with the same filters hits the React Query cache instantly.
- Discovery pages are client-rendered after a small server shell; the cache
  warms with the first render, then `placeholderData: (prev) => prev` keeps
  the previous grid visible while a new query loads.
- Categories are cached for 5 minutes (changes infrequently).
- `<ProductGrid>` is rendered as a flat list; no virtualisation needed at
  current page sizes (≤24). Adding `react-virtuoso` is a one-line drop-in
  if a future stage pushes the page size above 100.

## Architectural rule

The discovery pages **orchestrate**: they parse URL state, call the right
hook, and assemble layout. Filtering, sorting, paging, and facet counting
all happen server-side via `/v1/storefront/search`. No business logic lives
in the frontend.
