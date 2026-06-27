# Frontend Data Layer

The storefront is a thin client. Pages call hooks, hooks call services,
services call the typed API client. No fetch / business logic lives in UI
components.

## Layers

```
Page (Server / Client Component)
   │  uses hook
   ▼
React Query Hook (`apps/web/lib/hooks/*.ts`)
   │  calls service
   ▼
Service Module (`apps/web/lib/api/services/*.ts`)
   │  uses apiFetch
   ▼
Typed API Client (`apps/web/lib/api/client.ts`)
   │  fetch + Zod
   ▼
NestJS API (`/v1/*`)
```

### Pages

Live under route groups:

- `apps/web/app/(shop)/*` — the production storefront (home, products,
  cart, account, search, …).
- `apps/web/app/design/*` — the Stage 3.6 validation prototypes, kept for
  QA. Their hex-literal exemption was preserved.

### Hooks (`lib/hooks/`)

Tiny wrappers around `useQuery` / `useMutation`. They own query keys, stale
times, and the `enabled` flag for parameterised reads. Page code never builds
a query key directly.

```ts
const { data, isLoading } = useProduct(slug); // GET product-by-slug
const { addItem } = useCart(); // optimistic mutation
```

### Services (`lib/api/services/`)

Resource-oriented modules. Each method takes plain TypeScript arguments and
returns a Zod-parsed payload. Services never import React.

- `catalogService` — products, collections, categories.
- `searchService` — search + autocomplete.
- `cartService` — cart CRUD + merge.
- `customerService` — register / login / verify / reset / profile / addresses.
- `checkoutService` — session, shipping rates, review, payment intent, place,
  orders, order detail.
- `cmsService` — pages, posts, navigation, announcements, testimonials, FAQs.
- `opsService` — public settings + maintenance state.

### API client (`lib/api/client.ts`)

`apiFetch(schema, opts)` — typed wrapper around `fetch`:

- `credentials: 'include'` so cookies travel with every request.
- 401 → single-flight `/v1/auth/refresh` call → replay the original request.
  Concurrent 401s share one refresh round-trip.
- Errors normalised to `ApiError` carrying `status`, `code`, optional `details`,
  and the server's `requestId`.
- AbortSignal pass-through; React Query supplies one via the `signal` argument
  of every `queryFn`, so navigating away cancels in-flight requests.
- `Idempotency-Key` header for write-once endpoints (used by checkout `place`).
- Successful responses are parsed against a Zod schema — contract drift
  throws an explicit error so the regression surfaces immediately.

### Schemas (`lib/api/schemas.ts`)

One Zod schema per response shape. All responses are validated; the inferred
types (`Product`, `CartView`, `Order`, …) are the only types the rest of the
frontend uses.

## Adding a new endpoint

1. Add the request/response Zod schema in `lib/api/schemas.ts`.
2. Add a method to the matching service in `lib/api/services/<resource>.ts`.
3. Export a hook from `lib/hooks/<resource>.ts` with a stable `queryKey`.
4. Consume the hook from the page. No `fetch` in the component.

## Why Zod parse on every response?

- Prevents `any` from leaking out of `fetch`.
- Detects backend drift early; a missing field becomes a thrown error at the
  boundary instead of a `undefined.toFixed` deep in a component.
- The parsed shape matches the inferred TS type — no second source of truth.

The price of an extra parse per response is negligible compared to a network
round-trip.
