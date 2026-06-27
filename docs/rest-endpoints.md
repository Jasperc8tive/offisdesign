# REST Endpoints

Stage 3 endpoint catalogue. **No implementation.** This document lists every
resource, route, request and response shape (at a structural level), auth
requirements, authorization rules, and error responses. Conventions in
`api-conventions.md` apply universally and are not repeated per endpoint.

All routes are under `/v1/...` and grouped by audience:

- **Storefront** — public reads + guest cart (`/v1/storefront/...`).
- **Account** — authenticated customer (`/v1/account/...`).
- **Auth** — login/refresh/logout/password flows (`/v1/auth/...`).
- **Admin** — back-office (`/v1/admin/...`), `admin:typ` JWT, RBAC.
- **Webhooks (inbound)** — provider callbacks (`/v1/webhooks/...`).
- **System** — health/internal (`/v1/system/...`).

Notation:

- `auth: public | customer | admin` — required principal type.
- `perm: <none> | <permission key>` — required permission(s); `:own` indicates
  ownership check.
- `errors: [codes]` lists endpoint-specific error codes beyond the universal
  set (validation, auth, rate-limit).

---

## 1. Auth (`/v1/auth`)

### `POST /v1/auth/customer/register`

- auth: public · perm: none
- body: `{ email, password, firstName?, lastName?, phone? }`
- 201: `{ customer: CustomerDto, accessTokenExpiresIn }`
- side-effects: issues cookies; emits `customer.registered`; sends verify email
- errors: `EMAIL_TAKEN`

### `POST /v1/auth/customer/login`

- auth: public · idempotency: no
- body: `{ email, password }`
- 200: `{ customer, accessTokenExpiresIn }`
- errors: `INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`

### `POST /v1/auth/customer/logout` · 204

### `POST /v1/auth/customer/refresh` · 200 — refresh cookie only

### `POST /v1/auth/customer/password/forgot` · 204 — always returns 204 to avoid enumeration

### `POST /v1/auth/customer/password/reset` body: `{ token, newPassword }`

### `POST /v1/auth/customer/email/verify` body: `{ token }`

### `POST /v1/auth/customer/email/resend-verification` (rate-limited)

### `POST /v1/auth/admin/login`

- auth: public · body: `{ email, password, mfaCode? }`
- 200 or `MFA_REQUIRED` (challenge token returned)

### `POST /v1/auth/admin/logout` · 204

### `POST /v1/auth/admin/refresh` · 200

### `POST /v1/auth/admin/mfa/verify` body: `{ challengeToken, code }`

---

## 2. Storefront (`/v1/storefront`)

All endpoints are `auth: public`. Reads only; writes that affect persistent
state (cart) live under `/v1/account` (which accepts guest tokens too).

### Catalogue

- `GET /v1/storefront/products` — list/filter products
  - filters: `collection_slug`, `category_slug`, `tag`, `status` (locked to `Published`),
    `price[gte|lte]`, `q`, `in_stock`
  - sort: `-created_at`, `price`, `-price`, `title`
- `GET /v1/storefront/products/:slug` — product detail (variants, options, media, related)
- `GET /v1/storefront/products/:slug/availability` — per-variant stock summary
- `GET /v1/storefront/collections` — list
- `GET /v1/storefront/collections/:slug` — detail + paginated products
- `GET /v1/storefront/categories` — flat or nested via `?tree=true`
- `GET /v1/storefront/categories/:slug` — detail + paginated products

### Search

- `GET /v1/storefront/search` — `q` required; resources: products, collections, pages, blog posts
- response: `{ data: { products, collections, pages, blogPosts }, meta }`

### CMS

- `GET /v1/storefront/pages/:slug`
- `GET /v1/storefront/navigation/:key`
- `GET /v1/storefront/blog-posts` (paginated)
- `GET /v1/storefront/blog-posts/:slug`
- `GET /v1/storefront/announcements/active`
- `GET /v1/storefront/banners/active?placement=...`
- `GET /v1/storefront/faqs?category=...`
- `GET /v1/storefront/testimonials?limit=...`

### Misc

- `GET /v1/storefront/settings/public` — only allow-listed public settings
- `POST /v1/storefront/newsletter/subscribe` body: `{ email }` · 202
- `POST /v1/storefront/newsletter/confirm` body: `{ token }`
- `POST /v1/storefront/newsletter/unsubscribe` body: `{ token }` or auth + email

---

## 3. Cart (`/v1/account/cart`)

Cart endpoints accept either an authenticated customer **or** a `guest_token`
cookie (issued by the storefront on first cart action). Idempotency-Key
recommended on writes.

- `GET /v1/account/cart` — returns the active cart for the principal (creates one if absent)
- `POST /v1/account/cart/items` body: `{ variantId, qty }` · 200 returns updated cart
- `PATCH /v1/account/cart/items/:variantId` body: `{ qty }` (0 deletes)
- `DELETE /v1/account/cart/items/:variantId` · 204
- `POST /v1/account/cart/coupon` body: `{ code }` · 200 cart with `couponCode` applied
- `DELETE /v1/account/cart/coupon` · 204
- `POST /v1/account/cart/merge` — admin/auth: called by login flow internally;
  if a `guest_token` cookie is present and the customer has an active cart,
  merge per `domain-model.md` §6.3. Returns the resulting cart.

errors: `STOCK_UNAVAILABLE`, `INVALID_TRANSITION` (e.g. modifying a `Converted` cart),
`COUPON_NOT_APPLICABLE`, `OPTIMISTIC_LOCK`.

---

## 4. Checkout (`/v1/account/checkout`)

`auth: customer` (guests are upgraded to a guest Customer row during checkout).
**Idempotency-Key required.**

- `POST /v1/account/checkout/sessions` — creates a checkout session from the active cart;
  reserves stock; returns `{ checkoutSessionId, summary }`
- `GET /v1/account/checkout/sessions/:id` — session state
- `POST /v1/account/checkout/sessions/:id/address` body: `{ shipping, billing? }`
- `POST /v1/account/checkout/sessions/:id/shipping` body: `{ shippingMethodId }` _(future stage)_
- `POST /v1/account/checkout/sessions/:id/payments` body: `{ provider, methodData }`
  - 200: `{ payment: { status, clientSecret?, requiresAction? } }`
- `POST /v1/account/checkout/sessions/:id/confirm` — finalises the order after payment success
  - 201 `Order`
- `POST /v1/account/checkout/sessions/:id/cancel` — releases reservations · 204

errors: `STOCK_UNAVAILABLE`, `PAYMENT_REQUIRES_ACTION`, `PAYMENT_FAILED`,
`INVALID_TRANSITION`, `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY`.

---

## 5. Account — Customer Self-Service (`/v1/account`)

All `auth: customer`. Each endpoint enforces ownership.

### Profile

- `GET /v1/account/me`
- `PATCH /v1/account/me` body: `{ firstName?, lastName?, phone? }`
- `POST /v1/account/me/password/change` body: `{ currentPassword, newPassword }`
- `DELETE /v1/account/me` — soft delete + GDPR scrub job · 202

### Addresses

- `GET /v1/account/addresses`
- `POST /v1/account/addresses` · 201
- `PATCH /v1/account/addresses/:id`
- `DELETE /v1/account/addresses/:id` · 204
- `POST /v1/account/addresses/:id/default-shipping` · 204
- `POST /v1/account/addresses/:id/default-billing` · 204

### Orders (read-only for customer)

- `GET /v1/account/orders`
- `GET /v1/account/orders/:id`
- `POST /v1/account/orders/:id/cancel` — only while `Pending|AwaitingPayment` · 200

### Wishlists

- `GET /v1/account/wishlist`
- `POST /v1/account/wishlist` body: `{ productId, note? }` · 201
- `DELETE /v1/account/wishlist/:productId` · 204

### Reviews

- `GET /v1/account/reviews`
- `POST /v1/account/reviews` body: `{ productId, rating, title?, body }` · 201 (status=`Pending`)
- `PATCH /v1/account/reviews/:id` (while `Pending`)
- `DELETE /v1/account/reviews/:id` · 204

### Recently Viewed

- `GET /v1/account/recently-viewed`
- `POST /v1/account/recently-viewed` body: `{ productId }` · 204

### Newsletter (logged-in convenience)

- `POST /v1/account/newsletter/subscribe` · 204
- `POST /v1/account/newsletter/unsubscribe` · 204

---

## 6. Admin — Catalog (`/v1/admin/catalog`)

`auth: admin`. Permissions per endpoint.

### Products — `perm: catalog:read|write`

- `GET    /v1/admin/catalog/products`
- `POST   /v1/admin/catalog/products` body: full product create payload
- `GET    /v1/admin/catalog/products/:id`
- `PATCH  /v1/admin/catalog/products/:id`
- `DELETE /v1/admin/catalog/products/:id` (soft)
- `POST   /v1/admin/catalog/products/:id/publish`
- `POST   /v1/admin/catalog/products/:id/archive`
- `POST   /v1/admin/catalog/products/:id/duplicate`

#### Variants

- `GET    /v1/admin/catalog/products/:id/variants`
- `POST   /v1/admin/catalog/products/:id/variants`
- `PATCH  /v1/admin/catalog/variants/:id`
- `DELETE /v1/admin/catalog/variants/:id`

#### Options / Values

- `POST   /v1/admin/catalog/products/:id/options`
- `PATCH  /v1/admin/catalog/options/:id`
- `DELETE /v1/admin/catalog/options/:id`
- `POST   /v1/admin/catalog/options/:id/values`
- `PATCH  /v1/admin/catalog/option-values/:id`
- `DELETE /v1/admin/catalog/option-values/:id`

#### Media on product

- `POST   /v1/admin/catalog/products/:id/images` body: `{ mediaId, altText?, position? }`
- `PATCH  /v1/admin/catalog/products/:id/images/:imageId`
- `DELETE /v1/admin/catalog/products/:id/images/:imageId`
- (same shape for `videos`, `documents`)

#### Specifications & links

- `POST   /v1/admin/catalog/products/:id/specifications`
- `PATCH  /v1/admin/catalog/products/:id/specifications/:specId`
- `DELETE /v1/admin/catalog/products/:id/specifications/:specId`
- `POST   /v1/admin/catalog/products/:id/links` body: `{ targetProductId, kind, position? }`
- `DELETE /v1/admin/catalog/products/:id/links/:linkId`

### Collections — `perm: catalog:read|write`

- Standard CRUD under `/v1/admin/catalog/collections`
- `POST /v1/admin/catalog/collections/:id/products` body: `{ productIds: [] }`
- `DELETE /v1/admin/catalog/collections/:id/products/:productId`

### Categories — `perm: catalog:read|write`

- Standard CRUD; tree maintained server-side (`?parentId=...` on list).

### Tags — Standard CRUD under `/v1/admin/catalog/tags`.

---

## 7. Admin — Inventory (`/v1/admin/inventory`)

`auth: admin`. `perm: inventory:read|write`.

- `GET    /v1/admin/inventory/warehouses`
- `POST   /v1/admin/inventory/warehouses`
- `PATCH  /v1/admin/inventory/warehouses/:id`
- `DELETE /v1/admin/inventory/warehouses/:id` (RESTRICT if stock)
- `GET    /v1/admin/inventory/items?warehouse_id=&variant_id=&low_stock=`
- `GET    /v1/admin/inventory/items/:id`
- `POST   /v1/admin/inventory/items/:id/adjust` body: `{ delta, reason, note? }`
- `POST   /v1/admin/inventory/items/bulk-adjust` body: `[ {variantId, warehouseId, delta, reason} ]`
- `GET    /v1/admin/inventory/adjustments?item_id=` — paginated ledger
- `GET    /v1/admin/inventory/reservations?status=&item_id=`
- `POST   /v1/admin/inventory/reservations/:id/release`

errors: `OPTIMISTIC_LOCK`, `STOCK_UNAVAILABLE` (going negative on hand).

---

## 8. Admin — Orders & Payments (`/v1/admin`)

`perm: orders:read|write|refund`, `payments:read|write|refund`.

### Orders

- `GET    /v1/admin/orders?status=&customer_id=&q=&placed_after=&placed_before=`
- `GET    /v1/admin/orders/:id`
- `PATCH  /v1/admin/orders/:id` — note, internal flags only (immutable totals)
- `POST   /v1/admin/orders/:id/cancel` — releases reservations if not shipped
- `POST   /v1/admin/orders/:id/refund` body: `{ amount, reason }` · creates Refund
- `POST   /v1/admin/orders/:id/notes` body: `{ note }` — appends an `OrderEvent`
- `POST   /v1/admin/orders/:id/shipments` body: `{ lines: [{ orderLineId, qty }], carrier?, trackingNumber? }`
- `PATCH  /v1/admin/orders/:id/shipments/:shipmentId`
- `POST   /v1/admin/orders/:id/shipments/:shipmentId/deliver`

### Payments

- `GET    /v1/admin/payments?order_id=&status=`
- `GET    /v1/admin/payments/:id`
- `POST   /v1/admin/payments/:id/capture` (if `RequiresAction|Processing`)
- `POST   /v1/admin/payments/:id/refunds` body: `{ amount, reason }`
- `GET    /v1/admin/payments/:id/refunds`

---

## 9. Admin — Pricing & Promotions (`/v1/admin/promotions`)

`perm: promotions:read|write`.

- Standard CRUD on `/coupons`, `/discounts`.
- `POST /v1/admin/promotions/coupons/:id/disable`
- `POST /v1/admin/promotions/coupons/:id/enable`
- `GET  /v1/admin/promotions/coupons/:id/redemptions`

---

## 10. Admin — CMS (`/v1/admin/content`)

`perm: content:read|write|publish`.

- CRUD on `/pages` (`?template=landing` filters landing pages) with block ops:
  - `GET    /pages/:id/blocks`
  - `POST   /pages/:id/blocks` body: `{ type, position, data, refEntityType?, refEntityId? }`
  - `PATCH  /pages/:id/blocks/:blockId`
  - `DELETE /pages/:id/blocks/:blockId`
  - `POST   /pages/:id/blocks/reorder` body: `{ order: [blockId, ...] }`
- CRUD on `/hero-sections`, `/banners`, `/announcements`, `/testimonials`, `/faqs`.
- Navigation:
  - CRUD on `/navigation-menus`
  - Items under `/navigation-menus/:menuId/items`, with `/reorder`.
- Blog: CRUD on `/blog-posts` and `/authors`.
- Publish/unpublish:
  - `POST /pages/:id/publish`
  - `POST /pages/:id/unpublish`
  - `POST /pages/:id/schedule` body: `{ publishedAt }`
  - same shape for `blog-posts`.

---

## 11. Admin — Media (`/v1/admin/media`)

`perm: media:read|write`.

- `GET    /v1/admin/media?kind=&q=`
- `POST   /v1/admin/media/upload-url` body: `{ kind, mimeType, byteSize, originalFilename? }`
  - returns: `{ mediaId, uploadUrl, uploadFields, expiresAt }` (pre-signed S3 POST)
- `POST   /v1/admin/media/:id/finalize` — confirms upload, kicks off variant generation · 202
- `GET    /v1/admin/media/:id`
- `PATCH  /v1/admin/media/:id` (altText, label)
- `DELETE /v1/admin/media/:id`

---

## 12. Admin — Customers (`/v1/admin/customers`)

`perm: customers:read|write|impersonate`.

- `GET    /v1/admin/customers?q=&status=`
- `GET    /v1/admin/customers/:id`
- `PATCH  /v1/admin/customers/:id` (status, name fields)
- `POST   /v1/admin/customers/:id/suspend`
- `POST   /v1/admin/customers/:id/reinstate`
- `DELETE /v1/admin/customers/:id` (soft + GDPR scrub job) · 202
- `GET    /v1/admin/customers/:id/addresses`
- `GET    /v1/admin/customers/:id/orders`
- `GET    /v1/admin/customers/:id/reviews`
- `POST   /v1/admin/customers/:id/impersonate` — creates a scoped storefront session token (logged)

---

## 13. Admin — Reviews (`/v1/admin/reviews`)

`perm: reviews:moderate`.

- `GET    /v1/admin/reviews?status=Pending|Published|Rejected`
- `POST   /v1/admin/reviews/:id/approve`
- `POST   /v1/admin/reviews/:id/reject` body: `{ reason }`
- `DELETE /v1/admin/reviews/:id`

---

## 14. Admin — Newsletter (`/v1/admin/newsletter`)

`perm: newsletter:read|write`.

- `GET    /v1/admin/newsletter/subscriptions?status=`
- `GET    /v1/admin/newsletter/subscriptions/export?format=csv`

---

## 15. Admin — Identity (`/v1/admin/identity`)

`perm: admins:read|write|grant`.

- `GET    /v1/admin/identity/users`
- `POST   /v1/admin/identity/users` body: `{ email, firstName?, lastName?, roleKeys: [] }`
- `PATCH  /v1/admin/identity/users/:id`
- `POST   /v1/admin/identity/users/:id/suspend`
- `POST   /v1/admin/identity/users/:id/reinstate`
- `DELETE /v1/admin/identity/users/:id`
- `POST   /v1/admin/identity/users/:id/roles` body: `{ roleKeys: [] }` (replace)
- `GET    /v1/admin/identity/roles`
- `POST   /v1/admin/identity/roles` body: `{ key, name, permissionKeys: [] }`
- `PATCH  /v1/admin/identity/roles/:key`
- `DELETE /v1/admin/identity/roles/:key`
- `GET    /v1/admin/identity/permissions` — registry (read-only)

---

## 16. Admin — Platform (`/v1/admin/platform`)

`perm: platform:read|write`.

- `GET    /v1/admin/platform/audit-logs?entity_type=&entity_id=&actor_id=&from=&to=`
- `GET    /v1/admin/platform/settings`
- `PATCH  /v1/admin/platform/settings/:key` body: `{ value }`
- `GET    /v1/admin/platform/feature-flags`
- `PATCH  /v1/admin/platform/feature-flags/:key` body: `{ value, audience, audienceConfig? }`
- `GET    /v1/admin/platform/notifications`
- `POST   /v1/admin/platform/notifications/:id/read`
- `GET    /v1/admin/platform/webhooks`
- `POST   /v1/admin/platform/webhooks` body: `{ url, events: [], description? }` — returns secret once
- `PATCH  /v1/admin/platform/webhooks/:id`
- `DELETE /v1/admin/platform/webhooks/:id`
- `POST   /v1/admin/platform/webhooks/:id/test`
- `GET    /v1/admin/platform/webhook-deliveries?webhook_id=&status=`
- `POST   /v1/admin/platform/webhook-deliveries/:id/retry`
- `GET    /v1/admin/platform/background-jobs?queue=&status=`

---

## 17. Webhooks Inbound (`/v1/webhooks`)

Each endpoint is `auth: public` but verifies a provider signature.

- `POST /v1/webhooks/stripe` — Stripe events; verifies `Stripe-Signature`
- `POST /v1/webhooks/postmark` (or equivalent) — bounces, complaints
- _(Add per integration; rate-limited per-provider.)_

Behaviour: validate signature → enqueue a `BackgroundJob` to process →
respond `200 { received: true }` quickly. Idempotent on the provider's event id.

---

## 18. System (`/v1/system`)

- `GET /v1/system/healthz` — liveness; returns `{ status: "ok" }`. Public, uncached.
- `GET /v1/system/readyz` — readiness; checks DB + Redis + S3 connectivity.
- `GET /v1/system/version` — `{ version, gitSha, builtAt }`. Public.
- `GET /v1/system/metrics` — Prometheus exposition. Auth: internal network only.

---

## 19. Universal Error Responses

Every endpoint may return any of:

- `400 BAD_REQUEST`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN` (or `NOT_OWNER`)
- `404 NOT_FOUND`
- `422 VALIDATION_FAILED`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`

Endpoint-specific codes are listed inline above.

---

## 20. Permission Catalogue (initial)

Permissions referenced in this document, listed here as a single registry. Each
permission is a row in `AdminPermission`; new entries arrive via migrations.

```
catalog:read         catalog:write
inventory:read       inventory:write
orders:read:any      orders:write       orders:refund
payments:read        payments:write     payments:refund
promotions:read      promotions:write
content:read         content:write      content:publish
media:read           media:write
customers:read       customers:write    customers:impersonate
reviews:moderate
newsletter:read      newsletter:write
admins:read          admins:write       admins:grant
platform:read        platform:write
```

Default role mapping (seeded in Stage 4):

- `superadmin` → all permissions.
- `admin` → all except `admins:grant`.
- `staff` → `catalog:*`, `inventory:*`, `orders:*` (no refund), `content:*`,
  `media:*`, `customers:read|write`, `reviews:moderate`, `newsletter:read`.
- `viewer` → all `:read` permissions only.

---

## 21. What's Deliberately Out of Stage 3

- Returns / RMA endpoints (Stage 7).
- Public API tokens (post-launch).
- Subscriptions, gift cards, loyalty.
- Multi-language read APIs.
- Shipping rate APIs (carrier integration is Stage 7+).
