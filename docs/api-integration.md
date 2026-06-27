# API Integration

How the storefront talks to the backend.

## Configuration

| Key                   | Default                 | Purpose                     |
| --------------------- | ----------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL for the NestJS API |
| `NEXT_PUBLIC_WEB_URL` | `http://localhost:3000` | Public storefront origin    |

Both are inlined at build time. Values land in `apps/web/lib/api/config.ts`.

## Authentication

The API issues HttpOnly cookies (`offis_at`, `offis_rt`). Every request goes
through `apiFetch` with `credentials: 'include'`, so cookies travel
transparently. The storefront never reads or stores tokens itself.

### Refresh flow

1. The original request hits a protected endpoint and receives 401.
2. `client.ts` calls `POST /v1/auth/refresh` exactly once (single-flight —
   concurrent 401s share the same in-flight refresh promise).
3. The server sends fresh `offis_at` / `offis_rt` cookies.
4. The original request is replayed once with `skipAuthRefresh: true`. A
   second 401 surfaces as `ApiError(status=401)`.

### Sign-in / sign-out

`useAuth().login(email, password)` calls `/v1/auth/customer/login`. On
success the provider:

- Invalidates `customer.me` and the cart query.
- Calls `POST /v1/cart/merge` so the anonymous cookie cart joins the
  authenticated cart (idempotent, server-enforced).

Logout invalidates the same queries and lets the server clear cookies.

## Error envelope

The API always returns:

```json
{ "error": { "code": "STRING", "message": "string", "details": "?" }, "requestId": "?" }
```

`ApiError` mirrors this and is the type every page-level handler can rely on.
Network failures (DNS, CORS, offline) surface as `NetworkError`.

## Cart integration

`useCart()` exposes:

- `cart` — current `CartView` (server total, server discount, server lines).
- `itemCount` — derived from `cart.cart.items`.
- `addItem`, `updateItem`, `removeItem`, `clear`, `applyCoupon` — async
  mutations with optimistic updates against the `['cart','current']` query.

The anonymous cookie (`offis_cart_anon`) is issued by the API on the first
`GET /v1/cart` and travels via `credentials: 'include'`. The frontend never
sees the value.

## CMS integration

CMS calls are pure reads against `/v1/storefront/cms/*`:

- `useNavigation(key)` — header/footer trees, 5-minute stale time.
- `useAnnouncements()` — live-window-filtered, 1-minute stale.
- `useCmsPage(slug)`, `useBlogPosts()`, `useBlogPost(slug)`, `useTestimonials()`,
  `useFaqs()` — 5-minute stale.

No CMS logic exists in components — the announcement bar, header nav, and
landing pages all consume whatever the API returns.

## Product integration

Product cards across the home, search, and recommendations call:

- `useProducts(params)` — paginated, filterable list.
- `useProduct(slug)` — single detail with variants + media + collections + tags.
- `useCollections({ pageSize })` / `useCollection(slug)`.
- `useCategories()` — flat list, cached 5 minutes.

The PDP picks the cheapest variant by default and lets the user swap; the cart
mutation sends the chosen `variantId`.

## Search integration

`useSearch(params)` calls `/v1/storefront/search` with optional `q`,
`collection[]`, `category[]`, `tag[]`, `priceMin`, `priceMax`, `sort`, `page`,
`pageSize`. The result includes `hits`, `facets`, and a paginated `total`.

`useAutocomplete(q)` calls `/v1/storefront/search/autocomplete` once `q.length

> = 2`. Stale time is 60 seconds so the dropdown reuses recent results during
> rapid typing.

## Performance

- **Route-level prefetch** is available through the same hooks; server
  components can call the service directly and prime the query cache via
  `dehydrate`/`HydrationBoundary` when needed. The Stage 8 implementation
  stays client-side for simplicity — server prefetch is wired per page in the
  next stage.
- **Request cancellation** is automatic via the `AbortSignal` React Query
  hands every `queryFn`; navigating away during a long request aborts it.
- **Schema parse** runs once per response; the cost is negligible compared to
  network latency.
- **Stale-while-revalidate** is the default — pages render cached data
  instantly and revalidate in the background.
- **Optimistic mutations** on cart so the UI updates without waiting for
  the round-trip.

## What lives where

| Concern                                   | Location                          |
| ----------------------------------------- | --------------------------------- |
| URL building, fetch, refresh, error shape | `lib/api/client.ts`               |
| Response shapes                           | `lib/api/schemas.ts`              |
| Resource methods                          | `lib/api/services/*.ts`           |
| Query keys, stale times, `enabled`        | `lib/hooks/*.ts`                  |
| Auth state machine                        | `lib/providers/auth.provider.tsx` |
| Cart state machine + optimistic           | `lib/providers/cart.provider.tsx` |
| Pages                                     | `app/(shop)/*`                    |
| Validation prototypes                     | `app/design/*`                    |
