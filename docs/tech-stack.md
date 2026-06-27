# Technology Stack

Stage 2 decisions on every technology the project will use. Each entry lists
**Why**, **Alternatives considered**, **Trade-offs**, and **Version constraint**.
Specific versions are pinned in `package.json` only when Stage 3+ creates the
apps; the constraints below define the acceptable ranges.

Brand tokens (`#B81F34` / `#410C14` / `#350D13` / `#FEFEFE`) are surfaced through
`packages/ui` and consumed via Tailwind + CSS variables. They are not a
"technology" choice but every UI tech below assumes them as the only colour source.

---

## 1. Frameworks

### 1.1 Next.js (App Router) — storefront & admin

- **Why:** mature React meta-framework with first-class RSC + streaming + ISR;
  best-in-class SEO story; integrates cleanly with our caching/CDN model.
- **Alternatives:** Remix (excellent DX but smaller ecosystem, weaker ISR);
  Astro (great for content, weaker for app surfaces like cart/checkout);
  plain Vite + React Router (we'd rebuild routing, SEO, caching ourselves).
- **Trade-offs:** App Router still evolving; some patterns change between
  minors. Mitigated by pinning to a single minor per release train.
- **Version:** `>=14.2 <16`.

### 1.2 NestJS — API

- **Why:** opinionated module/DI structure maps directly to our bounded-context
  layout; first-class TS; strong middleware/guard/interceptor model for auth,
  validation, logging.
- **Alternatives:** Express + custom layout (we'd hand-roll DI/structure);
  Fastify standalone (faster, but less structure); tRPC (excellent DX but
  couples web and api too tightly and weaker for non-TS clients).
- **Trade-offs:** heavier abstractions than raw Express; decorators tie us to
  TS. Both acceptable.
- **Version:** `>=10 <12`.

### 1.3 React

- **Why:** mandated by Next.js; ecosystem alignment.
- **Alternatives:** none compatible with the chosen frameworks.
- **Trade-offs:** none.
- **Version:** version that ships with the chosen Next.js minor.

---

## 2. Runtime & Language

### 2.1 Node.js

- **Why:** required by Next.js, NestJS, Prisma; LTS line is stable and well-supported.
- **Alternatives:** Bun (immature for NestJS + Prisma combo);
  Deno (Node-compat overhead, weaker library reach).
- **Trade-offs:** none material.
- **Version:** `>=20.11 <23` (active LTS at planning time). Pinned in `.nvmrc`.

### 2.2 TypeScript

- **Why:** type safety is non-negotiable for an enterprise rebuild; aligns all
  three apps and packages.
- **Alternatives:** plain JS (rejected).
- **Trade-offs:** build/typecheck time; mitigated by project references and
  incremental builds.
- **Version:** `>=5.4 <6`. `strict: true` everywhere.

### 2.3 Package manager: pnpm

- **Why:** fastest install, strict node_modules layout enforces dependency
  boundaries, native workspaces.
- **Alternatives:** npm workspaces (slower, looser); yarn berry (more friction).
- **Trade-offs:** developers must use the configured pnpm version; enforced via
  `packageManager` field + corepack.
- **Version:** `>=9 <11`.

### 2.4 Build orchestrator: Turborepo (preferred) or Nx

- **Why:** task graph + remote caching across apps/packages.
- **Alternatives:** raw pnpm `--filter` scripts (no caching, slow CI).
- **Trade-offs:** Turbo is simpler; Nx is more powerful but heavier. Final
  pick locked in Stage 14 — both are compatible with the layout above.
- **Version:** Turbo `>=2 <3` if chosen.

---

## 3. Database

### 3.1 PostgreSQL

- **Why:** relational integrity for orders/inventory; mature JSONB for flexible
  fields; rich full-text capability; ubiquitous managed offerings.
- **Alternatives:** MySQL (weaker JSON / FTS); MongoDB (transactional
  guarantees too loose for orders/inventory); SQLite (dev only).
- **Trade-offs:** vertical scaling first, sharding later if ever; acceptable.
- **Version:** `>=15 <17` (managed).

### 3.2 Redis

- **Why:** cache, rate-limit counters, session/refresh-token tracking, queue
  backend.
- **Alternatives:** in-memory app cache (doesn't survive scale-out); KeyDB
  (less managed-host support).
- **Trade-offs:** another moving piece. Worth it.
- **Version:** `>=7 <8`.

---

## 4. ORM & Data Access

### 4.1 Prisma

- **Why:** type-safe client, migration tooling, strong DX; matches our Node + TS
  stack; integrates with Postgres JSONB and enums cleanly.
- **Alternatives:** Drizzle (excellent, lighter, SQL-first — close runner-up;
  may revisit at scale); Kysely (great query builder, no migration tooling);
  TypeORM (declined: legacy patterns).
- **Trade-offs:** Prisma engine binary in deploys; occasional cold-start cost;
  long-tail SQL features sometimes need `$queryRaw`. Acceptable.
- **Version:** `>=5.15 <7`.

---

## 5. Authentication

### 5.1 JWT (asymmetric) + opaque refresh tokens

- **Why:** stateless access tokens scale horizontally; rotating refresh tokens
  in Redis give us revocation without per-request DB hits. See
  `architecture.md` §4.
- **Alternatives:** server sessions (cheaper for small scale, but DB hit on
  every request); OAuth-only via 3rd party (lock-in, complicates admin).
- **Library:** `jsonwebtoken` or NestJS `@nestjs/jwt`. Final pick in Stage 6.
- **Trade-offs:** must manage key rotation; mitigated by JWKS-style key set.
- **Version:** library versions pinned at Stage 6.

### 5.2 Password hashing: Argon2id

- **Why:** modern, memory-hard, recommended by OWASP.
- **Alternatives:** bcrypt (still acceptable but weaker against GPU attacks).
- **Trade-offs:** CPU cost on login; tunable parameters.
- **Version:** `argon2` `>=0.40 <1`.

---

## 6. Storage

### 6.1 S3-compatible object storage

- **Why:** standard interface, every cloud provides it (AWS S3, Cloudflare R2,
  Backblaze B2, MinIO for local). Decouples app from provider.
- **Alternatives:** filesystem (doesn't scale); provider-specific blob APIs
  (lock-in).
- **Trade-offs:** signed-URL flow adds a hop; acceptable for media.
- **Library:** `@aws-sdk/client-s3` (works against any S3-compatible endpoint).
- **Version:** `@aws-sdk/*` `>=3.600 <4`.

---

## 7. Caching

### 7.1 Redis cache (server-side)

- **Why:** centralised, shared across API instances; TTL + tag invalidation.
- **Alternatives:** per-instance memory (inconsistent under scale-out).

### 7.2 Next.js Data Cache + `revalidateTag` / `revalidatePath`

- **Why:** native to the framework; aligns with ISR on the CDN.
- **Alternatives:** custom fetch caching (we'd reimplement the framework's job).

### 7.3 CDN edge cache

- **Why:** lowest-latency layer for HTML and assets.
- **Alternatives:** none (we will use a CDN).

---

## 8. Search

### 8.1 Postgres full-text (launch) → dedicated engine (later)

- **Why:** ship with Postgres FTS — sufficient for a catalog of our expected
  size and avoids an extra system. Re-evaluate when catalog grows or facet
  complexity demands it.
- **Alternatives at launch:** Meilisearch, Typesense, Algolia — all viable,
  all add operational surface area before they're needed.
- **Trade-offs:** facets/typo-tolerance/ranking are easier in a dedicated
  engine; revisit in Stage 8 with real query patterns.
- **Version:** comes with Postgres.

---

## 9. UI Libraries

### 9.1 Tailwind CSS

- **Why:** utility-first scales across three apps; integrates cleanly with our
  token system in `packages/ui`; small runtime.
- **Alternatives:** CSS Modules (more boilerplate); vanilla-extract (slower DX);
  styled-components (RSC-hostile).
- **Trade-offs:** large class strings; mitigated by `clsx` + component primitives.
- **Version:** `>=3.4 <5`.

### 9.2 shadcn/ui (pattern, not a dependency)

- **Why:** we copy primitive _recipes_ into `packages/ui` and own the code.
  Gives us Radix-based accessible primitives without a versioning dependency.
- **Alternatives:** Radix directly (we'd write the styling glue); MUI/Chakra
  (heavyweight, harder to theme to our brand precisely).
- **Trade-offs:** we maintain the copied code; that is the point.
- **Version:** N/A (vendored).

### 9.3 Radix UI primitives

- **Why:** accessible, unstyled headless primitives underpinning our shadcn
  patterns.
- **Version:** `>=1 <3` (per-primitive).

### 9.4 Framer Motion

- **Why:** declarative animations; matches the motion plan from Stage 1; good
  React 19 / Next 15 support.
- **Alternatives:** GSAP (excellent but bigger and imperative);
  CSS-only (limits orchestration).
- **Trade-offs:** bundle size; mitigated by route-level dynamic import.
- **Version:** `>=11 <13`.

### 9.5 Lucide React (icons)

- **Why:** comprehensive, MIT-licensed, tree-shakable.
- **Alternatives:** Heroicons (smaller set); custom SVGs (slow to grow).
- **Version:** `>=0.400 <1`.

---

## 10. State Management

### 10.1 Server state: TanStack Query

- **Why:** caching, background refresh, mutation lifecycle — the gold standard
  for server state in React.
- **Alternatives:** SWR (lighter but fewer features); raw `fetch` in RSC for
  reads only (we still need a client cache for islands).
- **Version:** `>=5 <6`.

### 10.2 Client state: React state + Zustand (only where justified)

- **Why:** most UI state is local; Zustand for genuinely cross-component client
  state (cart drawer, mini-cart count, modal stacks).
- **Alternatives:** Redux Toolkit (overkill); Jotai (fine, but Zustand is
  simpler for our patterns).
- **Version:** Zustand `>=4 <6`.

---

## 11. Forms & Validation

### 11.1 React Hook Form

- **Why:** uncontrolled-first, fast, small; integrates with Zod resolvers.
- **Alternatives:** Formik (slower, larger); native + custom (we'd rebuild RHF).
- **Version:** `>=7.50 <9`.

### 11.2 Zod

- **Why:** single schema source for forms, server actions, API DTOs, and
  cross-app types in `packages/types`.
- **Alternatives:** Yup (weaker TS inference); Valibot (lighter; revisit if
  bundle pressure matters).
- **Version:** `>=3.23 <4` (or v4 once stable + ecosystem catches up).

---

## 12. Email

### 12.1 Transactional provider (Postmark or Resend)

- **Why:** managed deliverability; webhooks for bounce/complaint.
- **Alternatives:** SES (cheapest, more setup); SendGrid (acceptable).
- **Library:** provider SDK behind a `Mailer` interface in `apps/api/src/infra/mailer`.
- **Final pick:** Stage 9.

### 12.2 React Email

- **Why:** author templates in React/TS in `packages/ui/emails/` so brand tokens
  apply consistently.
- **Alternatives:** MJML (more verbose); HTML templates (no token reuse).
- **Version:** `>=2 <4`.

---

## 13. Payments

### 13.1 Stripe (assumed pending Stage 7 confirmation)

- **Why:** broadest feature set, strong SCA support, robust webhooks, good DX.
- **Alternatives:** Adyen (enterprise-heavy), Braintree (declining momentum).
- **Trade-offs:** fees; vendor lock-in mitigated by isolating in a
  `PaymentGateway` interface.
- **Library:** `stripe` SDK in API; `@stripe/stripe-js` + Elements in web.
- **Version:** SDK `>=15 <19`.

---

## 14. Analytics

### 14.1 Privacy-respecting product analytics (Plausible or PostHog)

- **Why:** cookieless by default (Plausible) or self-host option (PostHog).
- **Alternatives:** GA4 (consent complexity), Mixpanel (cost).
- **Final pick:** Stage 13.

### 14.2 Server-side event collection

- **Why:** funnels need server-confirmed events (checkout, order placed),
  not just client beacons.
- **Approach:** API emits events to the chosen analytics endpoint; client
  forwards only UX events.

---

## 15. Logging

### 15.1 Pino (API)

- **Why:** fastest structured logger in Node; JSON by default; great with
  NestJS via `nestjs-pino`.
- **Alternatives:** Winston (slower, less structured by default).
- **Version:** `>=9 <10`.

### 15.2 Next.js logs → platform aggregator

- **Why:** Next emits to stdout; the platform ships logs to the aggregator.
- **Approach:** request-id correlation header set by `apps/api` and echoed
  in Next middleware.

### 15.3 Standards

- All logs structured JSON. Mandatory fields: `ts`, `level`, `requestId`,
  `service`, `msg`. PII and tokens are redacted by configured serializers.

---

## 16. Monitoring & Observability

### 16.1 Error tracking: Sentry

- **Why:** broad SDK coverage (Next + Nest), source-map support, release tracking.
- **Alternatives:** self-hosted GlitchTip; Bugsnag.
- **Version:** `@sentry/*` `>=8 <10`.

### 16.2 Metrics + tracing: OpenTelemetry → managed backend

- **Why:** vendor-neutral instrumentation; pick backend in Stage 15
  (Datadog / Grafana Cloud / self-hosted).
- **Alternatives:** vendor SDK directly (lock-in).
- **Version:** OTel SDK `>=1 <2`.

### 16.3 Uptime & synthetic checks

- External pinger on `/healthz` of api/web/admin + a synthetic checkout
  smoke test. Provider chosen in Stage 15.

---

## 17. Testing

### 17.1 Unit + integration: Vitest (web/admin/packages), Jest (api)

- **Why:** Vitest is fast and Vite-native — best fit for Next/React packages;
  Jest is NestJS's native default.
- **Alternatives:** Vitest for everything (works, but fights Nest's tooling).
- **Versions:** Vitest `>=1.6 <3`, Jest `>=29 <31`.

### 17.2 Component / accessibility: Testing Library + axe

- **Why:** standard React testing patterns; axe for a11y assertions.
- **Versions:** RTL `>=15 <17`, `jest-axe` / `vitest-axe` per runner.

### 17.3 End-to-end: Playwright

- **Why:** modern, multi-browser, parallel; runs against both `apps/web` and
  `apps/admin` from one harness.
- **Alternatives:** Cypress (single-browser at quality, slower CI).
- **Version:** `>=1.45 <2`.

### 17.4 API contract: Zod schemas + supertest

- **Why:** Zod DTOs double as contract; supertest exercises HTTP without a real
  server.

### 17.5 Coverage thresholds

- Targets locked in Stage 11. Floor at 80% line / 70% branch for `apps/api`
  domain + service code at minimum.

---

## 18. CI / CD

### 18.1 GitHub Actions

- **Why:** repo lives on GitHub; native PR integration; mature.
- **Alternatives:** CircleCI, Buildkite — fine, no reason to pay extra here.

### 18.2 Pipeline shape

- PR: install (cached) → lint → typecheck → unit/integration → e2e (filtered)
  → build (Turborepo cache) → artifacts.
- Merge to `main`: same + deploy to `dev`.
- Release tag: promote image to `staging` then `prod` (manual approval gate
  on `prod`).

### 18.3 Quality gates

- ESLint clean, TS clean, tests green, no secrets in diff (gitleaks),
  no `any` regressions, bundle size budget check on web/admin.

---

## 19. Infrastructure

### 19.1 Containers

- Docker images built per app via multi-stage Dockerfiles in `docker/`.
- Distroless or Alpine base depending on Prisma engine compatibility — locked
  in Stage 15.

### 19.2 Hosting (decision deferred to Stage 14/15)

- **Option A:** Vercel for `apps/web` + `apps/admin`; managed Postgres (Neon /
  Supabase / RDS); managed Redis (Upstash / Elasticache); S3 / R2 for media;
  containerised `apps/api` on Fly.io / Render / ECS.
- **Option B:** All three apps containerised on a single cloud (AWS ECS or GKE).
- Architecture is provider-agnostic; the deployment topology in `architecture.md`
  §7 holds either way.

### 19.3 IaC

- Terraform (or Pulumi) at Stage 15. No console clickops in `prod`.

### 19.4 DNS, TLS, secrets

- DNS at the registrar; TLS via the platform (ACM or equivalent); secrets in
  the platform's secret manager.

---

## 20. Summary Table

| Concern              | Choice                               | Constraint     |
| -------------------- | ------------------------------------ | -------------- |
| Storefront framework | Next.js App Router                   | `>=14.2 <16`   |
| Admin framework      | Next.js App Router                   | `>=14.2 <16`   |
| API framework        | NestJS                               | `>=10 <12`     |
| Language             | TypeScript (strict)                  | `>=5.4 <6`     |
| Runtime              | Node.js LTS                          | `>=20.11 <23`  |
| Package manager      | pnpm                                 | `>=9 <11`      |
| Build orchestrator   | Turborepo (Nx alt)                   | `>=2 <3`       |
| Database             | PostgreSQL                           | `>=15 <17`     |
| Cache / queue        | Redis                                | `>=7 <8`       |
| ORM                  | Prisma                               | `>=5.15 <7`    |
| Object storage       | S3-compatible (`@aws-sdk/client-s3`) | `>=3.600 <4`   |
| Auth                 | JWT (asymmetric) + Argon2id          | per library    |
| Styling              | Tailwind CSS                         | `>=3.4 <5`     |
| Primitives           | shadcn/Radix vendored                | per primitive  |
| Animation            | Framer Motion                        | `>=11 <13`     |
| Icons                | Lucide React                         | `>=0.400 <1`   |
| Server state         | TanStack Query                       | `>=5 <6`       |
| Client state         | Zustand (sparingly)                  | `>=4 <6`       |
| Forms                | React Hook Form                      | `>=7.50 <9`    |
| Validation           | Zod                                  | `>=3.23 <4`    |
| Email                | React Email + Postmark/Resend        | TBD Stage 9    |
| Payments             | Stripe (assumed)                     | SDK `>=15 <19` |
| Analytics            | Plausible / PostHog                  | TBD Stage 13   |
| Logging              | Pino + structured stdout             | `>=9 <10`      |
| Errors               | Sentry                               | `>=8 <10`      |
| Tracing              | OpenTelemetry                        | `>=1 <2`       |
| Unit tests           | Vitest / Jest                        | per app        |
| E2E                  | Playwright                           | `>=1.45 <2`    |
| CI/CD                | GitHub Actions                       | n/a            |
| Containers           | Docker (multi-stage)                 | n/a            |
| Hosting              | Deferred (Stage 14/15)               | n/a            |
