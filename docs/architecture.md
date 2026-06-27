# System Architecture

Stage 2 blueprint for the Shopify-free rebuild of branchfurniture.com. This document
fixes the high-level shape of the system. It does **not** define database tables,
API endpoints, or UI components — those are produced in later stages.

Brand tokens used by every layer (canonical, set in `packages/ui/src/tokens/`):
`#B81F34` primary · `#410C14` secondary/text · `#350D13` accent · `#FEFEFE` background.

---

## 1. Overall System Architecture

A three-app, single-database, single-API system delivered from one TypeScript
monorepo:

```
                          ┌─────────────────────────┐
                          │      CDN / Edge         │
                          │  (static, images, ISR)  │
                          └────────────┬────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
┌───────▼────────┐            ┌────────▼────────┐            ┌────────▼────────┐
│  apps/web      │            │  apps/admin     │            │  External:      │
│  Next.js       │            │  Next.js        │            │  Stripe, email, │
│  storefront    │            │  back-office    │            │  analytics      │
└───────┬────────┘            └────────┬────────┘            └────────┬────────┘
        │  HTTPS / JSON                 │  HTTPS / JSON               │
        │  (TanStack Query)             │  (TanStack Query)           │
        └──────────────┬────────────────┘                             │
                       │                                              │
                ┌──────▼────────────────────────────────────┐         │
                │  apps/api   (NestJS)                      │◀────────┘
                │  REST + JSON · JWT/RBAC · Zod/DTO         │   webhooks
                │  Modules: catalog · cart · checkout ·     │
                │  orders · auth · content · media · admin  │
                └─────┬──────────────┬──────────────┬───────┘
                      │              │              │
              ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
              │ PostgreSQL   │ │  Redis    │ │  S3-compat  │
              │ (Prisma)     │ │ cache /   │ │  object     │
              │ primary store│ │ sessions /│ │  storage    │
              │              │ │ queues    │ │  (media)    │
              └──────────────┘ └───────────┘ └─────────────┘
```

- **Storefront (`apps/web`)** is the customer-facing Next.js App Router site.
  Renders mainly via Server Components + selective ISR; client islands for cart,
  search, forms, and motion.
- **Admin (`apps/admin`)** is a separate Next.js app for catalog, orders, content,
  and user management. Server-rendered, RBAC-gated, never exposed to anonymous users.
- **API (`apps/api`)** is a NestJS service holding _all_ business logic, validation,
  and persistence. Both web and admin talk to it over HTTPS/JSON.
- **PostgreSQL** is the single source of truth.
- **Redis** is volatile: cache, rate limits, sessions/refresh blacklist, background queues.
- **S3-compatible object store** holds media (product imagery, downloadable assets).
- The CDN sits in front of `apps/web` (static + ISR) and in front of S3 (media).

There is no Shopify, no Liquid, no Storefront API, no Shopify webhooks, and no
Shopify-derived data model.

---

## 2. Layered Architecture

Each app follows the same conceptual layering, even though the concrete shape
differs between Next.js apps and the NestJS API.

### 2.1 API (`apps/api`) — four strict layers

1. **Transport / Controller** — HTTP routing, request shape, status codes.
   Owns nothing business-domain; delegates immediately.
2. **Application / Service** — orchestrates use-cases: validation, authorization
   checks, transactions, calls to repositories, calls to integrations.
3. **Domain** — pure TypeScript: entities, value objects, domain rules.
   No framework imports. No I/O.
4. **Infrastructure** — Prisma repositories, Redis adapters, S3 adapters,
   payment-gateway adapters, mailer adapters. Implements interfaces declared
   by the domain/application layers.

Rule: dependencies point **inward only** (Transport → Application → Domain;
Infrastructure → Domain). Domain never imports framework, Prisma, or HTTP types.

### 2.2 Web / Admin (`apps/web`, `apps/admin`) — render layering

1. **Route segment** (App Router) — server components, data fetching via
   server-side API client; sets caching/revalidation policy.
2. **Feature module** — `features/<name>/` containing server actions, query
   hooks (TanStack Query), and feature-scoped components.
3. **UI primitives** — imported from `packages/ui` only. No route or feature
   may redeclare a primitive locally.
4. **Edge / middleware** — auth gating, locale, redirects, security headers.

Rule: a route segment may import from features and `packages/ui`, but a feature
may not import from a route segment.

---

## 3. Request Lifecycle

A typical storefront read (e.g. product detail page):

1. Browser → CDN. If ISR-cached and fresh, CDN serves HTML directly.
2. CDN miss → Edge middleware in `apps/web` (locale, auth cookie sniff,
   security headers).
3. Server component for the route runs; calls the **server-side API client**
   with the user's identity (if any), hitting `apps/api`.
4. `apps/api`:
   a. Global pipes: request id, logging, Zod/DTO validation.
   b. Auth guard reads JWT (if present) and resolves the principal.
   c. RBAC guard checks role/scope for the route.
   d. Controller delegates to the service.
   e. Service consults Redis cache, falls back to Postgres via Prisma repository.
   f. Service returns a DTO; controller serialises with consistent envelope.
5. Next.js renders RSC output; selectively hydrates client islands.
6. Response returns through the CDN, which may cache HTML (ISR) and assets.

A typical write (e.g. add-to-cart, checkout, admin update):

1. Client island calls a **server action** (`apps/web`) or a route handler
   (`apps/admin`) — never the API directly from the browser for mutating calls
   that need server-side secrets.
2. The server action calls `apps/api` over HTTPS with the user's auth context.
3. API runs validation → auth/RBAC → service → transaction → optional
   event publish → response.
4. Server action revalidates affected tags/paths (`revalidateTag`,
   `revalidatePath`) and returns a result to the client.

---

## 4. Authentication Flow

- **Mechanism:** stateless JWT access tokens + opaque refresh tokens.
- **Storage:** access token in an httpOnly, Secure, SameSite=Lax cookie scoped
  to the app domain; refresh token in a separate httpOnly cookie scoped to the
  `/auth/refresh` path. No tokens in `localStorage`.
- **Issuance:** `apps/api` issues both tokens on login. Access TTL short
  (target ~15 min), refresh TTL long (target ~30 days), refresh is rotating.
- **Validation:** every API request passes through a global auth guard that
  verifies the access token signature, expiry, and revocation flag.
- **Refresh:** silent refresh endpoint accepts the refresh cookie, validates
  it against Redis (per-user rotation chain), issues a new pair, and revokes
  the prior refresh token.
- **Logout:** clears cookies and revokes the active refresh chain in Redis.
- **Password reset / email verification:** signed, single-use tokens delivered
  by email; consumed via dedicated API routes.
- **Admin app:** same JWT scheme but a separate cookie domain/path scope so
  storefront and admin sessions cannot collide.

Concrete schemas, claims, and endpoints are defined in Stage 3.

---

## 5. Authorization Strategy

Role-based access control (RBAC) with optional scope/permission grains.

- **Roles (initial set):** `guest`, `customer`, `staff`, `admin`.
  `guest` is implicit when no token is present.
- **Permission model:** roles map to a fixed set of _permissions_ (e.g.
  `catalog:write`, `orders:read:any`, `orders:read:own`). Services are
  written against permissions, not role names, so roles can evolve.
- **Enforcement points:**
  - API: global auth guard → RBAC guard per controller method via decorator.
  - Web/admin: server-side checks in route segments + middleware redirects.
    Client-side checks are advisory only (UX), never load-bearing.
- **Ownership rules:** for resources owned by a user (orders, addresses, cart)
  services enforce ownership in addition to permissions.
- **Default-deny:** any route lacking an explicit policy is denied.

Concrete permission catalogue is produced in Stage 3 alongside the API spec.

---

## 6. Data Flow

```
[ Web / Admin ]
      │   Read paths:  Server Component → API client → API → service → cache?
      │                                                          │
      │                                                          ▼
      │                                                  Redis cache  ── miss ──▶ Postgres (Prisma)
      │                                                          │                       │
      │                                                          ◀──────  warms  ────────┘
      │
      │   Write paths: Server Action / Route Handler → API → service
      │                                                          │
      │                                                          ▼
      │                                                  Postgres TX (Prisma)
      │                                                          │
      │                                                          ▼
      │                                                  Cache invalidation (Redis)
      │                                                          │
      │                                                          ▼
      │                                                  Side-effects (email, search index, queue)
      │
      └──  Media reads/writes go directly Web/Admin ↔ S3 via signed URLs
           issued by the API. Bytes never traverse the API.
```

Rules:

- Postgres is authoritative. Redis is rebuildable; never the source of truth.
- All writes go through a service in `apps/api`. The web/admin apps never
  touch Postgres directly.
- All media uploads use API-issued pre-signed URLs; reads go via CDN-fronted S3.

---

## 7. Deployment Topology

```
┌──────────────────────── Production ────────────────────────┐
│                                                            │
│  CDN (edge)                                                │
│   ├── apps/web        (containerised Next.js, autoscaled)  │
│   ├── apps/admin      (containerised Next.js, smaller)     │
│   └── media bucket    (S3 behind CDN)                      │
│                                                            │
│  apps/api             (containerised NestJS, autoscaled)   │
│   ├── PostgreSQL      (managed, primary + read replica*)   │
│   ├── Redis           (managed, persistence off for cache, │
│   │                    on for sessions/queues)             │
│   ├── Object storage  (S3-compatible)                      │
│   └── Mailer / Payments / Analytics (external SaaS)        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- All three apps ship as separate container images built from the monorepo.
- Each app has its own CI pipeline target but shares the same lint/test/build
  primitives. Final infra choice (provider, orchestrator) is locked in the
  infrastructure stage; the architecture is provider-agnostic.
- Read replica is a Stage 12+ optimisation and is optional at launch.

---

## 8. Service Boundaries

Even though `apps/api` is a single deployable, it is organised as bounded
modules. Modules talk to each other through their public service interfaces,
never by reaching into each other's repositories.

Initial bounded contexts:

- **Identity** — users, sessions, tokens, password reset, email verification.
- **Catalog** — products, variants, collections, taxonomies, media references.
- **Content** — pages, blog, navigation, marketing blocks.
- **Cart** — carts, line items, pricing snapshot, promotions (read-side).
- **Checkout** — checkout sessions, address capture, payment intent orchestration.
- **Orders** — orders, fulfilments, returns, refunds.
- **Media** — upload URL issuance, asset metadata, image variants.
- **Notifications** — transactional email, future channels.
- **Admin / Audit** — admin-only operations, audit log.

Rules:

- Each module owns its tables. Cross-module reads happen via the owning module's
  service (or via a thin read-model where justified later).
- Cross-module writes flow through an explicit application service or, where
  asynchrony is justified, a domain event on the queue.
- A module split into its own deployable is a Stage 12+ option, not a Stage 2 decision.

---

## 9. Environment Strategy

Four environments, identical shape, progressively more locked down:

| Env       | Purpose             | Data                       | Deploys               |
| --------- | ------------------- | -------------------------- | --------------------- |
| `local`   | Developer machine   | Seeded fake data           | On save               |
| `dev`     | Shared integration  | Seeded fake data           | Every merge to `main` |
| `staging` | Pre-prod, prod-like | Sanitised prod-shaped data | On release candidate  |
| `prod`    | Live customers      | Real data                  | On tagged release     |

Principles:

- The **same container image** promotes from `dev` → `staging` → `prod`.
  Environments differ only by configuration and secrets.
- Configuration is read from environment variables only (12-factor). No
  environment-specific code branches.
- A single `packages/config` exposes a typed, validated config loader so the
  three apps cannot silently disagree on what a variable means.
- Secrets live in the platform's secret manager, never in the repo, never in
  `.env` files committed to git.
- No environment except `prod` may read prod data without sanitisation.

---

## 10. Security Architecture

Threats considered up-front; specifics implemented per stage.

- **Transport:** HTTPS everywhere; HSTS on storefront and admin; secure cookies.
- **Auth:** see §4. JWT signed with an asymmetric key; key rotation supported.
- **Authorisation:** default-deny, RBAC + ownership (see §5).
- **Input validation:** every API boundary validates with Zod/DTO. No
  unvalidated request data ever reaches a service.
- **Output encoding:** React handles HTML escaping; rich content goes through
  an allow-listed sanitiser before render.
- **CSRF:** state-changing browser calls go through Next.js server actions /
  route handlers, which attach an origin check + token. Pure-API third-party
  callers use bearer tokens (not cookies) and are exempt.
- **Rate limiting:** per-IP and per-principal limits on auth, checkout, and
  search endpoints via Redis.
- **Secrets management:** platform secret manager; no secrets in env files,
  logs, or error responses.
- **Logging hygiene:** PII and tokens are scrubbed before logs leave the app.
- **Dependencies:** lockfile committed; automated vulnerability scanning in CI;
  no auto-merge of major bumps.
- **Headers:** strict Content-Security-Policy, `Referrer-Policy`,
  `X-Content-Type-Options`, `Permissions-Policy`, `X-Frame-Options` (admin).
- **Admin isolation:** separate subdomain, separate cookie scope, IP allowlist
  optional, mandatory MFA for `admin` role (target).
- **Data at rest:** managed Postgres encryption; S3 server-side encryption.
- **Backups:** automated daily Postgres snapshots with documented restore drill.
- **Auditability:** admin writes append to an immutable audit log table.

---

## 11. Open Architectural Questions (carried to later stages)

Not blockers for Stage 2, but flagged so we don't forget:

- Hosting provider and orchestrator (Vercel + managed services vs.
  containers on a single cloud) — locked in Stage 14/15.
- Search: Postgres full-text vs. a dedicated search engine (Meilisearch /
  Typesense / Algolia) — decided in Stage 3 with the catalog schema.
- Payments provider (Stripe assumed; final pick in Stage 7).
- Whether `apps/admin` keeps its own Next.js app or collapses into a route
  segment of `apps/web` — re-evaluated after Stage 4.
- Multi-currency and multi-region at launch vs. post-launch.
