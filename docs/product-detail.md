# Product Detail Page

`app/(shop)/products/[slug]/page.tsx` is a **server component** owning
`generateMetadata`; it renders the client `<ProductDetail>` for the
interactive surface.

## Composition

```
ProductPage (server, exports generateMetadata)
   │   fetches the product for SEO
   ▼
ProductDetail (client)
   ├── Breadcrumb + Breadcrumb JSON-LD
   ├── Gallery (image grid + active zoom)
   ├── Detail column
   │     ├── Badges (status / sale)
   │     ├── Heading, brand, Rating, PriceTag
   │     ├── VariantPicker (one button group per option)
   │     ├── Quantity + WishlistButton
   │     └── Add-to-bag Button + delivery Alert
   ├── Tabs (Details / Materials / Delivery / Reviews)
   ├── RelatedProducts (focal collection or recent overall)
   └── RecentlyViewedStrip (localStorage backed)
```

## Per-product SEO

`generateMetadata` runs on the server before render — it:

- Calls `catalogService.product(slug)` for canonical name, description,
  brand, and pricing.
- Emits `title`, `description`, `alternates.canonical`, OpenGraph,
  Twitter Card, and `product:price:amount` / `product:price:currency`
  meta tags.
- Points the `og:image` at `/og/product/[slug]` — a dynamic Next.js
  `ImageResponse` that renders a brand-coloured card with the product name
  and from-price using the satori engine (`runtime: 'edge'`).

`<ProductDetail>` inlines two JSON-LD payloads at render time via the
shared `<JsonLd>` helper:

- `BreadcrumbList` — the same breadcrumb model the visual breadcrumb shows.
- `Product` — name, description, brand, SKU, and an `Offer` with the active
  variant's price converted from minor units to major.

## Gallery

`components/pdp/gallery.tsx`:

- 4:5 active image with a `cursor-zoom-in` hover transform (`scale-110`,
  `duration-base`, easing tokens). No JS-driven pan — the CSS transform is
  enough for the "quick zoom" UX a sofa shopper expects.
- Up to four thumbnails as `aria-pressed` toggle buttons. Active thumb
  shows a brand ring; everything else is a clean placeholder until media
  wiring lands (Stage 11).
- Native `<img>` with `loading="eager"` on the active image and
  `loading="lazy"` on the thumbnails for first-paint efficiency.

## Variant picker

`components/pdp/variant-picker.tsx`:

- Renders one button group per `ProductOption`, with a button per
  `OptionValue`.
- Clicking a value calls `pickByOptionValue(optionValueId)` which finds the
  best matching variant by keeping every other current option fixed; if no
  exact combination exists, the closest available variant is selected.
- Values with no matching variant are disabled — the user sees them but
  can't pick them.

## Related products

`components/pdp/related-products.tsx`:

- Pulls four recent products from the focal collection (the first
  collection on the PDP); falls back to recent overall if there is no
  focal collection.
- Excludes the current product so the strip is never the same item again.
- Reuses `<ProductGrid>` so card visuals, spacing, and analytics stay
  consistent across the site.

## Recently viewed

Local-only:

- The PDP calls `useRecentlyViewed().track({ productId, slug, name })`
  inside a `useEffect([data?.id])` so the row is recorded once per product.
- The strip renders the last four entries (excluding the focal product),
  capped at 12 in the store.

## Wishlist

Local-only foundation:

- `<WishlistButton>` toggles the product in/out via
  `useWishlist().toggle(...)`. The button's `aria-pressed` reflects state
  and the variant flips between `primary` and `outline`.
- The store is a JSON array in `localStorage` keyed `offis:wishlist:v1`,
  hydrated on mount and observable cross-tab through a `storage` listener.
- Each toggle emits a `cta_click` event tagged `wishlist`.

A server-side wishlist (customer-account-bound) is a follow-up: the
provider's interface stays the same, only the persistence layer swaps to a
typed service.

## Analytics

| Event                                        | When                                      |
| -------------------------------------------- | ----------------------------------------- |
| `page_view { path, title }`                  | on PDP mount with hydrated product        |
| `product_click`                              | every card in Related and Recently Viewed |
| `cart_item_added { variantId, productSlug }` | add-to-bag success                        |
| `cta_click { id: 'wishlist-add/remove' }`    | wishlist toggle                           |

## Empty / error UX

- Loading → `Skeleton` shells for gallery and detail column.
- 404 / API error → `EmptyResult` "Product not found".
- Product with no variants → `EmptyResult` "Not currently for sale".
- Tabs with no data → friendly placeholders ("Materials information coming soon").

## Out of scope (Stage 10)

- Real reviews (Reviews tab is a placeholder).
- Server-backed wishlist.
- Real media URLs (gallery still falls back to `bg-primary-subtle`).
- Inventory live indicator beyond the "In stock" badge.
- Cross-sell / up-sell distinct from "Related" (the schema supports
  `ProductLink.kind`; the PDP doesn't surface them yet).
