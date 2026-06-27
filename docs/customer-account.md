# Customer Account

The signed-in customer area lives under `/account` in `apps/web/app/(shop)/account/`.

## Pages

| Route                  | Purpose                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `/account`             | Dashboard. Avatar, verification badge, recent orders, address-book preview, profile + security cards. |
| `/account/orders`      | Paginated order history.                                                                              |
| `/account/orders/[id]` | Full order detail — line items, totals breakdown, status badge.                                       |
| `/account/profile`     | Edit first/last name, phone, marketing opt-in. Email is read-only.                                    |
| `/account/password`    | Change password. Requires current password. Server revokes all other sessions on success.             |
| `/account/addresses`   | Address book CRUD using `<AddressForm>` (the same component used by checkout).                        |
| `/account/sessions`    | List of active refresh-token sessions with revoke buttons.                                            |

Each page lazy-fetches its data via React Query hooks (`useOrders`, `useAddresses`, `useSessions`, `useUpdateProfile`, `useChangePassword`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress`, `useRevokeSession`).

## Auth gating

`/account/page.tsx` redirects unauthenticated visitors to `/account/login` from a top-level `useEffect`. Sub-pages assume the gate has already run — they are nested under the same provider tree.

## Email verification status

The dashboard inspects `user.emailVerifiedAt`. When unverified, a `<Badge>` shows "Email unverified" and a top-of-page `<Alert variant="warning">` invites the customer to check their inbox. Verification itself is handled by the existing `/account/verify` flow.

## Address book ↔ checkout reuse

`<AddressForm>` lives in `components/checkout/` and is imported by both the checkout flow and the address book. This guarantees the two surfaces stay in lockstep — country list, field set, validation, and same-as-shipping toggle are all owned by a single component.

## Sessions

`/account/sessions` lists rows from `/v1/customer/me/sessions` (active refresh tokens). Each entry shows user-agent, IP address, and `createdAt`. Revoking a session calls `DELETE /v1/customer/me/sessions/:id`, which marks the session as `revokedAt = now()` server-side. The customer's _current_ session is included in the list — revoking it logs them out on the next refresh round-trip.

## Layered architecture

Pages orchestrate; sections compose; components stay presentation-only. No business logic (pricing, validation rules, etc.) is duplicated in the account UI — every mutation is a call to a typed service function.
