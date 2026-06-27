# State Management

The storefront uses three storage layers, each with a clear purpose. Choose
the right tool per piece of state.

## 1. React Query — server state

Anything that comes from the API. Owned by `QueryClient` in
`lib/providers/query.provider.tsx`.

### Defaults

- `staleTime: 30s` — most queries refetch silently after 30 seconds.
- `gcTime: 5min` — unused queries are discarded after 5 minutes.
- `refetchOnWindowFocus: false` — fewer surprise refetches.
- `retry`: 0 for 4xx (won't become healthy on retry), up to 2 for 5xx /
  network.

### Stale-time overrides

| Hook                                                                      | Stale        | Why                                                    |
| ------------------------------------------------------------------------- | ------------ | ------------------------------------------------------ |
| `useCmsPage`, `useCmsPost`, `useNavigation`, `useTestimonials`, `useFaqs` | 5 min        | CMS is edited rarely; cache hard.                      |
| `useAnnouncements`                                                        | 1 min        | Time-windowed; tighter than other CMS.                 |
| `useAutocomplete`                                                         | 1 min        | Repeated rapid queries reuse results.                  |
| `useCategories`                                                           | 5 min        | Tree shape changes infrequently.                       |
| `useCart`                                                                 | 30 s         | The provider owns optimistic updates; reads are cheap. |
| Everything else                                                           | default 30 s |                                                        |

### Mutations

`useMutation` is the workhorse. The cart provider implements the optimistic
pattern:

```ts
const addItem = useMutation({
  mutationFn: ({ variantId, quantity }) => cartService.addItem(variantId, quantity),
  onMutate: async (vars) => {
    await queryClient.cancelQueries({ queryKey: cartKey });
    const previous = queryClient.getQueryData(cartKey);
    queryClient.setQueryData(cartKey, optimisticNext(previous, vars));
    return { previous };
  },
  onError: (_e, _v, ctx) => ctx?.previous && queryClient.setQueryData(cartKey, ctx.previous),
  onSuccess: (next) => queryClient.setQueryData(cartKey, next),
});
```

The same pattern is used for `updateItem` and `removeItem`.

## 2. React Context — application state

Cross-cutting state that React Query doesn't model well. The providers in
`lib/providers/` expose typed hooks:

- `useAuth()` — `{ user, isLoading, isAuthenticated, login, logout, refresh }`.
- `useCart()` — `{ cart, itemCount, addItem, updateItem, removeItem, clear, applyCoupon }`.
- `useFeatureFlag(key)` / `useFeatureFlags()` — read a flag snapshot
  hydrated from the server. The snapshot is plain data; the hook is
  purely a context read.

The composition root (`lib/providers/index.tsx`) sets the order:
`Query → Theme → FeatureFlags → Auth → Cart → Toast`.

Auth depends on Query (it calls `useQuery`). Cart depends on Auth (its
mutations may invalidate auth-scoped queries). Feature flags depend on
nothing and so wrap the auth/cart pair to let either consume them.

## 3. URL state — what should survive a refresh

Search filters, sort, and pagination live in the URL via `useSearchParams`.
This keeps "share a filtered URL" working for free, and React Query's
`['search','results', params]` key change makes refetching automatic when the
URL updates.

The pattern in `app/(shop)/search/page.tsx`:

1. Page reads `useSearchParams`.
2. Derives a typed params object.
3. Passes it to `useSearch(params)`.
4. On user interaction, `router.push(newParams)` — the page re-renders, the
   query key changes, React Query refetches.

## What we don't use

- **Redux / Zustand / Jotai.** No global stores that overlap with React
  Query's domain. Cart and Auth are tiny providers; the rest is server state.
- **localStorage / cookies for auth.** Cookies are HttpOnly and server-managed.
- **React state for cart totals.** The server is the source of truth; the
  optimistic UI is a temporary mirror until the response arrives.

## Loading and error UX

Use `AsyncBoundary` from `lib/ux/async-boundary.tsx` to wrap any subtree that
uses `useQuery` with `suspense: true` — it composes Suspense + react-error-
boundary + React Query's reset behaviour. The default fallbacks use the
design system's `Skeleton` and `Alert` so spacing and tone stay consistent.

For non-suspense queries (the default), pages check `isLoading` /
`isError` themselves and render `Skeleton` placeholders or `EmptyResult`
fallbacks. The component library was built for this — no new components were
added in Stage 8.

## Cache invalidation

- Cart mutations: invalidated via `queryClient.setQueryData` directly in
  `onSuccess`. No `invalidateQueries` call is needed for the cart key itself.
- Auth state change (login/logout): invalidates `['customer','me']` and
  `['cart']` so guards and badges update.
- Profile / address mutations: invalidate `['customer','me']` and
  `['customer','addresses']`.
- CMS / catalog: server-side cache invalidation via Redis (Stage 5). The
  storefront refetches on its own stale-time schedule; long-stale resources
  pick up changes within 5 minutes.

## Open seams

- Server prefetch for SSR / streaming: hooks accept React Query options, so
  page-level `dehydrate` / `HydrationBoundary` can be wired in the next stage
  per route.
- ReactQueryDevtools is intentionally not included — turn it on in a feature
  branch when debugging.
- Future: cross-tab sync via BroadcastChannel for cart updates (BroadcastQuery
  plugin) once cart traffic justifies it.
