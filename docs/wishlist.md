# Wishlist

The wishlist is a **dual-mode** feature: anonymous visitors get a local-storage wishlist, and signed-in customers get a server-backed wishlist. The provider hides this distinction from the UI.

## Provider

`apps/web/lib/local-store/wishlist.provider.tsx` exposes a single `useWishlist()` hook:

```ts
interface ContextValue {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => void;
  count: number;
  /** True when the server is the source of truth. */
  serverBacked: boolean;
}
```

UI components such as `<WishlistButton>` call `toggle()` without caring whether the mutation is hitting `localStorage` or `POST /v1/customer/wishlist/:productId`.

## Mode selection

```
isAuthenticated && user → server-backed (React Query against /v1/customer/wishlist)
otherwise               → anonymous     (localStorage key offis:wishlist:v1)
```

The `serverBacked` boolean is exposed for surface-level affordances (e.g. an icon hint that "your wishlist follows you across devices").

## Login merge

When a customer signs in mid-session, the provider merges their anonymous list into the server list exactly once per customer id:

1. Read local wishlist.
2. `POST /v1/customer/wishlist/merge` with the list of product IDs.
3. On success, clear local storage and invalidate the server query so the UI rehydrates with the merged set.

A `mergedFor` `useRef` keyed by `customer.id` guarantees the merge runs once even across re-renders. If the merge fails (network/401), the provider silently falls back to local mode — the customer can retry by toggling any product.

## Backend

- `WishlistService` (`apps/api/src/wishlist/wishlist.service.ts`) — `list`, `add` (upsert), `remove` (delete + swallow not-found), `merge` (createMany + skipDuplicates).
- `WishlistController` — `JwtAuthGuard`-protected under `/v1/customer/wishlist`. Merge accepts up to 200 product IDs per call.
- `WishlistItem` Prisma model — composite PK `(customerId, productId)`, indexed by `(customerId, addedAt)` for newest-first listing.

## Storage budget

The anonymous wishlist is capped at 100 items (`MAX_ITEMS`). Older items are dropped from the tail when the cap is exceeded. This bound keeps localStorage well under typical 5 MB quotas even with large product names.
