# API Conventions

Stage 3 specification of how the REST API behaves. **Documented before any
endpoint is listed** (per the Stage 3 directive). Every endpoint in
`rest-endpoints.md` and every future endpoint conforms to this document.

The API is REST + JSON, served by `apps/api` (NestJS). Both `apps/web` and
`apps/admin` consume it; external clients are out of scope at launch (the
shape, however, does not preclude future public access).

---

## 1. Base, Versioning, Content Negotiation

- **Base URL (prod):** `https://api.<domain>`.
- **Versioning:** path-based, `/v1/...`. A breaking change to a resource's
  shape lands under `/v2/...`. Non-breaking additions (new optional fields,
  new endpoints) ship in the current version.
- **Deprecation:** deprecated endpoints respond with `Deprecation: true` and
  `Sunset: <RFC 1123 date>` headers. Minimum 90-day deprecation window.
- **Content type:** `application/json; charset=utf-8` for requests and
  responses. Multipart upload is only used for the media upload endpoint.
- **Compression:** gzip/brotli via the platform proxy; the app itself does not
  set content-encoding.
- **Locale:** `Accept-Language` is parsed but defaults to `en` at launch.

---

## 2. URL Conventions

- All resource paths are **plural, kebab-case nouns**: `/v1/products`,
  `/v1/order-lines`.
- Sub-resources nest **one level only**:
  `/v1/orders/{orderId}/refunds`. Deeper nesting becomes a top-level resource.
- IDs in paths are UUIDv7 strings; clients never construct ids.
- Query parameters use **snake_case**: `?customer_id=...&sort=-created_at`.
- Surface scoping by audience via path prefix:
  - `/v1/storefront/...` — public storefront reads (cached aggressively).
  - `/v1/account/...` — authenticated customer.
  - `/v1/admin/...` — admin operations (RBAC enforced).
  - `/v1/webhooks/...` — inbound webhooks (separate auth model).
- Action endpoints that don't fit CRUD use a POST verb under the resource:
  `POST /v1/admin/orders/{id}/refund` rather than inventing a new method.

---

## 3. HTTP Verbs & Status Codes

| Verb     | Use                             | Successful statuses                              |
| -------- | ------------------------------- | ------------------------------------------------ |
| `GET`    | Read                            | `200 OK`                                         |
| `POST`   | Create / non-idempotent action  | `201 Created`, `202 Accepted`, `200 OK` (action) |
| `PATCH`  | Partial update                  | `200 OK`                                         |
| `PUT`    | Full replace (rare)             | `200 OK`                                         |
| `DELETE` | Remove (soft delete by default) | `204 No Content`                                 |

Error statuses (and the `error.code` strings they map to in §5):

| Status                       | When                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `400 Bad Request`            | Malformed JSON, missing required header, parse failures                         |
| `401 Unauthorized`           | Missing or invalid auth token                                                   |
| `403 Forbidden`              | Authenticated but lacks permission / not owner                                  |
| `404 Not Found`              | Resource does not exist (or is soft-deleted and not accessible)                 |
| `409 Conflict`               | Concurrency / state-machine violation (`OPTIMISTIC_LOCK`, `INVALID_TRANSITION`) |
| `410 Gone`                   | Resource permanently removed (rare)                                             |
| `415 Unsupported Media Type` | Wrong content-type                                                              |
| `422 Unprocessable Entity`   | Semantic validation failure (Zod)                                               |
| `423 Locked`                 | Reservation or row lock contention                                              |
| `429 Too Many Requests`      | Rate limit exceeded                                                             |
| `500 Internal Server Error`  | Unhandled exception (never includes details)                                    |
| `502 / 503 / 504`            | Upstream / availability                                                         |

`200 vs 201`: prefer `201` for creates, `202` if accepted-but-async.

---

## 4. Response Envelope

### 4.1 Success

```json
{
  "data": <payload>,
  "meta": { "requestId": "01J..." }
}
```

- `data` is the resource (object) or an array of resources.
- For paginated lists, see §6.

### 4.2 Error

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable summary",
    "details": [{ "path": "body.email", "message": "Invalid email", "code": "INVALID_FORMAT" }]
  },
  "meta": { "requestId": "01J..." }
}
```

- `error.code` is **stable** — client logic may branch on it.
- `error.message` may evolve and is for humans.
- `error.details` is optional; present for validation, conflicts, etc.
- `meta.requestId` always present; clients echo it when reporting bugs.

### 4.3 Empty

`204 No Content` returns no body.

### 4.4 Field names

- Response field names are **camelCase**.
- Database columns are snake_case (see `database-architecture.md` §3); the
  API translates at the boundary.
- Timestamps are ISO 8601 in UTC with `Z` suffix.
- Money is the pair `{ amount: number, currency: "USD" }` where `amount` is
  an integer in minor units. **Money is always an object in responses**, never
  a bare number.

---

## 5. Error Catalogue (initial)

| Code                                         | HTTP | Notes                              |
| -------------------------------------------- | ---- | ---------------------------------- |
| `VALIDATION_FAILED`                          | 422  | Zod failure; `details` populated   |
| `BAD_REQUEST`                                | 400  | Parse / shape failures             |
| `UNAUTHENTICATED`                            | 401  | Missing/invalid token              |
| `INVALID_CREDENTIALS`                        | 401  | Login-specific                     |
| `EMAIL_NOT_VERIFIED`                         | 403  | Customer must verify before action |
| `FORBIDDEN`                                  | 403  | RBAC denial                        |
| `NOT_OWNER`                                  | 403  | Ownership check failed             |
| `NOT_FOUND`                                  | 404  |                                    |
| `CONFLICT`                                   | 409  | Generic state conflict             |
| `OPTIMISTIC_LOCK`                            | 409  | `version` mismatch                 |
| `INVALID_TRANSITION`                         | 409  | E.g. cancelling a shipped order    |
| `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY` | 409  | See §10                            |
| `STOCK_UNAVAILABLE`                          | 423  | Reservation contention             |
| `RATE_LIMITED`                               | 429  | `Retry-After` header set           |
| `PAYMENT_REQUIRES_ACTION`                    | 402  | Stripe 3DS-style flow              |
| `PAYMENT_FAILED`                             | 402  | Provider declined                  |
| `INTERNAL_ERROR`                             | 500  | Body omits details                 |

Adding a new code is a compatible change; **renaming or removing** a code is breaking.

---

## 6. Pagination

**Cursor-based by default.** Offset pagination is not supported.

### 6.1 Request

```
GET /v1/storefront/products?limit=24&cursor=eyJ0Ijo...
```

- `limit` — integer, 1..100. Default 20. Server caps at 100.
- `cursor` — opaque, base64url-encoded JSON `{ t: <createdAt>, id: <uuidv7> }`.
  Clients treat it as a black box.

### 6.2 Response

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "...",
    "pagination": {
      "cursor": "eyJ0Ijo...",
      "nextCursor": "eyJ0Ijo...",
      "hasMore": true,
      "limit": 24
    }
  }
}
```

- `nextCursor` is `null` when `hasMore` is false.
- Total counts are **not** returned by default (expensive). A separate
  `GET /<resource>/count` endpoint is offered for admin lists when needed.

### 6.3 Sort + cursor

Cursor encodes the **sort tuple** so changing `sort` invalidates the cursor.
Clients that change `sort` must drop the cursor.

---

## 7. Filtering

- All filter parameters are query-string, snake_case, and whitelisted per
  resource. Unknown filters return `400 BAD_REQUEST`.
- Multi-value filters use repeated keys or comma:
  `?status=draft&status=published` or `?status=draft,published`.
- Operators (when needed) are encoded with bracketed suffixes:
  `?price[gte]=1000&price[lte]=5000`.
  Supported operators: `eq` (default), `neq`, `gt`, `gte`, `lt`, `lte`, `in`,
  `nin`, `like`, `ilike`, `null`, `notnull`.
- Date filters accept ISO 8601 timestamps or `YYYY-MM-DD` shortcuts.
- Boolean filters accept `true|false|1|0`.

---

## 8. Sorting

- Single param `sort` accepts a **comma-separated list** of fields.
- Descending sort prefixed `-`: `sort=-created_at,price`.
- Whitelisted per resource. Unknown fields return `400`.
- Default sort documented per endpoint; typically `-created_at`.

---

## 9. Searching

- **Customer-facing search** (`/v1/storefront/search`) is its own endpoint, not
  a filter. Backed by the `SearchService` interface (`database-architecture.md`
  §9), Postgres FTS at launch.
- **List endpoints** accept a lightweight `q` parameter for substring/ILIKE
  matching on documented fields. Not a full-text search.
- Query parameters:
  - `q` — search string (≤ 200 chars).
  - `q_fields` — optional, comma-separated whitelist.
- Search results carry a `score` field in `meta` per item when ranked.

---

## 10. Idempotency

- All `POST` endpoints that may be retried (`/checkout`, `/payments`, all
  storefront write actions) accept an `Idempotency-Key` header — opaque UUID
  string generated by the client.
- Server behaviour:
  1. Hash the request body + path + method.
  2. Look up the key. If found and the hash matches, return the stored
     response. If found and the hash differs, return `409
IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY`.
  3. If not found, execute the request, then store `(key, hash, response)`
     for 24h in Redis.
- Header is required on `/checkout` and `/payments` endpoints; optional
  elsewhere.
- Idempotency does **not** turn a non-idempotent action into a safe action —
  it only deduplicates retries.

---

## 11. Authentication

- **Cookie-based for browsers (web/admin):** auth set by `apps/web` /
  `apps/admin` after login; the cookie is httpOnly, Secure, SameSite=Lax,
  domain-scoped.
- **Bearer for service / future external use:** `Authorization: Bearer <jwt>`.
- **Refresh** at `POST /v1/auth/refresh` accepts the refresh cookie only; never
  bearer.
- **Unauthenticated requests** to storefront read endpoints return public
  data with a guest cart binding only if `guest_token` cookie is present.
- **403 vs 401:** missing or bad token → 401; valid but insufficient → 403.

JWT specifics:

- Algorithm: `EdDSA` (Ed25519) or `RS256` (final pick Stage 6).
- Claims: `sub` (user id), `typ` (`customer` | `admin`), `roles?`,
  `permissions?`, `sid` (session id), `iat`, `exp`, `iss`, `aud`.
- Permission claims are denormalised at issuance; revocation enforced via the
  `sid` blacklist in Redis with TTL equal to remaining access-token life.

---

## 12. Authorization

- **Default-deny.** A controller method without a permission decorator is denied.
- Permissions take the form `<context>:<action>[:<scope>]`. Examples:
  `catalog:write`, `orders:read:any`, `orders:read:own`.
- **Ownership checks** for `:own` scopes are enforced in the service layer
  against the principal's id, not in the controller.
- **Public endpoints** declare `@Public()` explicitly.
- **Audience guards:** admin endpoints reject tokens with `typ='customer'`
  and vice versa.

---

## 13. Validation

- Every request body, query, and path param is validated by a **Zod schema**
  before reaching a service. Validation runs in a Nest global pipe.
- DTO types are inferred from Zod via `z.infer<typeof Schema>`. There is
  exactly one shape per endpoint; no parallel hand-written interfaces.
- Validation failures return `422 VALIDATION_FAILED` with `details[]`
  containing one entry per offending field.
- Unknown fields in request bodies are **rejected** by default (`strict`
  schemas); the exception is `providerData` JSONB on Payment, which is
  loosely validated.

---

## 14. Rate Limiting

- Backed by Redis (sliding window) via a global interceptor.
- **Buckets:**
  - `auth` — login, refresh, password-reset request: **5 / IP / minute** and
    **20 / IP / hour**.
  - `checkout` — `POST /v1/account/checkout`: **10 / customer / minute**.
  - `search` — storefront search: **60 / IP / minute**.
  - `webhook-in` — provider callbacks: **per-provider config**.
  - `default` — everything else: **120 / IP / minute** for unauthenticated,
    **600 / principal / minute** for authenticated.
- **Headers** on every response:
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- **429** responses include `Retry-After` (seconds) and `RATE_LIMITED` code.
- Admin endpoints have looser limits but are still bucketed to catch runaway
  scripts.

---

## 15. Caching (server-side)

- `GET` storefront responses set `Cache-Control: public, s-maxage=<n>, stale-while-revalidate=<m>`
  where appropriate, per-resource. Catalogue: 60s s-maxage, 600s SWR. CMS:
  300s / 3600s. Inventory and prices: `no-store` for accuracy.
- `ETag` headers on resource reads; `If-None-Match` is honoured and returns
  `304 Not Modified` when matching.
- The API itself uses Redis as an internal read cache for hot reads, with
  tag-based invalidation on writes (the tag set is per-module).

---

## 16. CORS

- `apps/web` and `apps/admin` are first-party; same-site cookies make CORS
  unnecessary for browser flows.
- Public APIs (post-launch) are served from the same domain or under a
  documented allowlist. Wildcard CORS is never enabled.

---

## 17. Headers

Inbound (commonly used):

- `Authorization` — bearer (server-to-server use)
- `Idempotency-Key` — see §10
- `If-None-Match` — see §15
- `Accept-Language`
- `X-Request-Id` — optional client-supplied id; if absent, server generates one

Outbound (on every response):

- `X-Request-Id`
- `X-RateLimit-*`
- `Cache-Control`
- `ETag` (on resource reads)
- `Deprecation` / `Sunset` (when applicable)
- Security headers handled by the platform/proxy (HSTS, CSP for HTML; not the API).

---

## 18. Pagination, Filter, Sort, Search — composability

A list endpoint accepts at most these query params:

```
limit, cursor, sort,
q, q_fields,
<resource-specific filters>...
```

Unrecognised parameters return `400`. Filters and `q` AND together. `sort`
must be a documented field set.

---

## 19. Webhooks (outbound)

- Delivered with `POST`, body is JSON event envelope:
  ```json
  {
    "id": "<event id>",
    "type": "order.placed",
    "occurredAt": "...",
    "data": { ... },
    "version": 1
  }
  ```
- Signed with `X-Webhook-Signature: t=<unix>,v1=<hex>` (HMAC-SHA256 over
  `t.body` using the webhook's secret). Signature scheme stable across versions.
- Retry with exponential backoff (1m, 5m, 30m, 2h, 12h, 1d) up to 7 attempts;
  delivery records persisted (`WebhookDelivery`).
- Receivers must respond within 5s with `2xx` or the attempt is retried.

---

## 20. OpenAPI

- The API generates an OpenAPI 3.1 document from Nest + Zod metadata.
- Served at `/v1/docs/openapi.json` and `/v1/docs` (Scalar/Swagger UI) in
  non-prod. In prod, OpenAPI is published as a build artefact and **not**
  served live.
- The generator runs in CI; PRs that change endpoints must update the
  generated artefact (lint check).
- Hand-written reference for each resource lives in `docs/api/<resource>.md`
  (added per module from Stage 6 onward); the generated OpenAPI complements,
  not replaces, those docs.

---

## 21. Storefront Read Cache Model (summary)

| Resource        | Endpoint pattern                                 | s-maxage | SWR   | ETag |
| --------------- | ------------------------------------------------ | -------- | ----- | ---- |
| Product detail  | `GET /v1/storefront/products/:slug`              | 60s      | 600s  | yes  |
| Product list    | `GET /v1/storefront/products`                    | 60s      | 300s  | yes  |
| Collection      | `GET /v1/storefront/collections/:slug`           | 60s      | 600s  | yes  |
| Page            | `GET /v1/storefront/pages/:slug`                 | 300s     | 3600s | yes  |
| Navigation      | `GET /v1/storefront/navigation/:key`             | 300s     | 3600s | yes  |
| Search          | `GET /v1/storefront/search`                      | 0        | 0     | no   |
| Cart            | `GET /v1/account/cart`                           | 0        | 0     | no   |
| Inventory check | `GET /v1/storefront/products/:slug/availability` | 0        | 0     | no   |

These values are starting points and tuned in Stage 11.
