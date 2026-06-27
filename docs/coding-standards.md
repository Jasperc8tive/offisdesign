# Coding Standards

Project-wide engineering standards. Every app and package conforms to these.
Where a standard can be enforced by tooling, it is — these docs describe the
rule and `packages/config` will hold the lint/format configuration.

Brand-token rule (repeated for emphasis): **no hex colour values may appear
anywhere outside `packages/ui/src/tokens/`.** The only colours that exist in
this codebase are `#B81F34` (primary), `#410C14` (secondary / text),
`#350D13` (accent), and `#FEFEFE` (background) — and they enter consuming code
exclusively through tokens / Tailwind classes / CSS variables.

---

## 1. Folder Conventions

- **kebab-case** for all folder names: `product-card/`, not `ProductCard/`.
- **kebab-case** for all file names except React components, which match the
  component name in **PascalCase**: `ProductCard.tsx`.
- One component per file. Co-located files use suffixes:
  `ProductCard.tsx`, `ProductCard.test.tsx`, `ProductCard.stories.tsx`.
- A folder always has an `index.ts` that re-exports the folder's public surface.
  Consumers import from the folder, never from internal files.
- Tests live next to the code they cover, except E2E (in `apps/*/tests/`).
- `__mocks__/` only where Jest/Vitest convention demands.

App-specific folders are defined in `monorepo-structure.md`.

---

## 2. Naming Conventions

| Thing                            | Style                             | Example                       |
| -------------------------------- | --------------------------------- | ----------------------------- |
| Folders                          | kebab-case                        | `checkout-summary/`           |
| Files (non-component)            | kebab-case                        | `format-money.ts`             |
| React components (file + export) | PascalCase                        | `ProductCard.tsx`             |
| Hooks                            | camelCase, prefix `use`           | `useCartTotals`               |
| Types & interfaces               | PascalCase, no `I` prefix         | `Order`, `OrderLine`          |
| Enums                            | PascalCase singular               | `OrderStatus`                 |
| Enum values                      | SCREAMING_SNAKE_CASE              | `OrderStatus.AwaitingPayment` |
| Constants                        | SCREAMING_SNAKE_CASE              | `MAX_CART_ITEMS`              |
| Variables, functions             | camelCase                         | `calculateSubtotal`           |
| Boolean variables/props          | `is/has/can/should` prefix        | `isOpen`, `hasError`          |
| Event handlers                   | `onX` (prop) / `handleX` (impl)   | `onSubmit` / `handleSubmit`   |
| React Context                    | `XContext` + `XProvider` + `useX` | `CartContext`, `useCart`      |
| Zod schemas                      | suffix `Schema`                   | `LoginSchema`                 |
| DTOs derived from schemas        | suffix `Dto`                      | `LoginDto`                    |
| API modules (NestJS)             | singular noun                     | `cart`, `order`               |
| Repositories                     | `<entity>Repository`              | `OrderRepository`             |
| Services                         | `<noun>Service`                   | `CheckoutService`             |
| DB tables                        | snake_case plural                 | `order_lines`                 |
| DB columns                       | snake_case                        | `created_at`                  |
| Env vars                         | SCREAMING_SNAKE_CASE              | `DATABASE_URL`                |

- No abbreviations except universally understood ones (`url`, `id`, `db`, `api`).
- Never use `data`, `info`, `helper`, `utils`, `manager` as the only word in a name.

---

## 3. TypeScript Rules

- `strict: true` everywhere. `noUncheckedIndexedAccess: true`.
- `noImplicitAny`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `exactOptionalPropertyTypes` — all on.
- **No `any`.** Use `unknown` at boundaries and narrow. `as` casts require a
  one-line comment justifying the cast.
- **No non-null assertions (`!`)** in committed code. Narrow with a guard.
- Prefer `type` for object shapes and unions; reserve `interface` for types
  meant to be merged or extended by consumers (rare in this codebase).
- Discriminated unions over optional fields when modelling variant data.
- Public functions and exported symbols carry explicit return types. Internal
  helpers may infer.
- Generics are named: `TItem`, `TKey`, not `T`/`U`/`V`.
- Use `as const` for literal tuples and lookup objects.
- Zod schemas are the source of truth at I/O boundaries; types are inferred
  with `z.infer<typeof ...Schema>`. Hand-written types must not duplicate
  schema shapes.
- Imports are sorted (eslint `import/order`). Type-only imports use
  `import type`.

---

## 4. Component Architecture

- **Server-first.** Default to Server Components. Make a component a Client
  Component only when it needs state, effects, browser APIs, or event handlers.
- A Client Component declares `'use client'` on its first line.
- **Primitives vs. compositions.** Reusable primitives live in `packages/ui`.
  Feature-specific compositions live in `apps/*/features/<feature>/`.
- Components are pure: no module-level side effects, no top-level fetches in
  Client Components.
- Data fetching belongs at the route segment (Server Component) or inside a
  feature's `server/` folder. Components receive data as props.
- Mutations from the UI go through **server actions** or route handlers —
  never `fetch('/api/...')` from a Client Component with credentials.
- Styling: Tailwind classes only. No inline `style` props except for dynamic
  values that can't be expressed in classes (and even then prefer CSS variables).
- Class composition: use `clsx`/`cn` helpers. No string concatenation.
- Accessibility:
  - Semantic HTML first, ARIA second.
  - Every interactive element is keyboard reachable and labelled.
  - Focus rings are visible (token-driven, never removed).
  - Colour contrast must clear AA — verified per Stage 1's `brand-retheme.md`.
- Forbidden in components:
  - Hex literals, RGB literals, or hardcoded colour names.
  - Magic numbers for spacing — use the 4px scale via Tailwind.
  - Direct `fetch` calls (use the typed API client or server actions).

---

## 5. API Conventions

The API is REST + JSON. Concrete endpoints are designed in Stage 3; the
conventions below govern that work.

- **Versioning:** all endpoints under `/v1/`. New breaking shape → `/v2/`.
- **URLs:** plural, kebab-case nouns. `/v1/products`, `/v1/order-lines`.
  Sub-resources nest one level: `/v1/orders/{id}/lines`.
- **Verbs:** `GET` (read), `POST` (create / non-idempotent action),
  `PATCH` (partial update), `PUT` (full replace — used sparingly),
  `DELETE` (remove).
- **Status codes:** `200` OK, `201` Created, `202` Accepted, `204` No Content,
  `400` Validation, `401` Unauthenticated, `403` Forbidden, `404` Not Found,
  `409` Conflict, `422` Semantic validation failure, `429` Rate limited,
  `500` Server error.
- **Response envelope (success):**
  ```
  { "data": <payload>, "meta": { "requestId": "..." } }
  ```
  Lists add `meta.pagination: { cursor, hasMore, limit }`.
- **Response envelope (error):**
  ```
  { "error": { "code": "STRING_CODE", "message": "human", "details": {...}? },
    "meta": { "requestId": "..." } }
  ```
- **Pagination:** cursor-based by default. Limit cap enforced server-side.
- **Filtering / sorting:** query params, snake_case keys, documented per
  resource. Whitelist server-side.
- **Idempotency:** `POST` endpoints that may be retried (checkout, payment
  intents) accept an `Idempotency-Key` header and dedupe on it.
- **Time:** all timestamps are ISO 8601 in UTC with `Z` suffix.
- **Money:** integers in the minor unit (e.g. cents) + ISO 4217 currency code;
  never floats.
- **IDs:** opaque strings (ULIDs or UUIDv7). Never expose sequential ints.
- **Validation:** every request body, query, and param is validated with Zod
  before reaching a service.
- **Documentation:** OpenAPI document generated from Nest + Zod metadata; lives
  at `/v1/docs` in non-prod environments. Hand-written `docs/api-*.md` files
  describe each module's endpoints (produced in Stage 6+).

---

## 6. Error Handling

- **Errors are values at the domain layer.** Services either return a
  successful DTO or throw a typed domain error (or return a Result if a
  module adopts that style). No silent failures.
- **Typed domain errors** extend a common base (e.g. `DomainError`) and carry
  a stable `code`. The HTTP exception filter maps `code` → status code +
  user-safe message.
- **No leaking internals.** Never include stack traces, SQL strings, file paths,
  or internal codes in client-facing responses. Internal context goes to logs
  with the same `requestId`.
- **Client / server-action errors** are caught at the boundary, mapped to a
  UX-friendly shape, and surfaced via the form's error model (RHF) or a toast.
- **Retries:** only for idempotent operations; exponential backoff with jitter;
  bounded attempts. Never retry on `4xx` except `408` and `429`.
- **Forbidden patterns:**
  - `try { ... } catch (e) {}` — swallowing without action.
  - `console.error` in committed code (use the logger).
  - Generic `Error("something went wrong")` — always specify.

---

## 7. Logging Standards

- One structured logger per app. Pino in `apps/api`; the platform logger in
  Next apps.
- **Mandatory fields on every log line:** `ts`, `level`, `requestId`, `service`,
  `msg`. Additional context goes under a `ctx` object.
- **Levels:** `trace` (off in prod), `debug` (dev only), `info` (state transitions
  worth noticing), `warn` (recoverable anomaly), `error` (unhandled or
  user-impacting failure), `fatal` (process about to die).
- **Never log:** passwords, tokens (access/refresh), full card numbers, full
  emails (mask), full addresses, raw request bodies for auth endpoints.
  Configure redaction in the logger.
- **Correlation:** API generates `requestId` and returns it as `X-Request-Id`.
  Next echoes it in subsequent server-side calls. Client errors carry it back
  to Sentry.
- **No `console.*`** in committed code outside one-off scripts in `scripts/`.

---

## 8. Git Conventions

### 8.1 Branch strategy

- **Trunk:** `main`. Always deployable to `dev`.
- **Feature branches:** short-lived, branched from `main`:
  - `feat/<scope>-<short-description>`
  - `fix/<scope>-<short-description>`
  - `chore/<scope>-<short-description>`
  - `docs/<scope>-<short-description>`
  - `refactor/<scope>-<short-description>`
- **No long-running release branches.** Releases are tags on `main`.
- **Hotfixes:** `fix/hotfix-<thing>` off `main`, merged via the same PR flow.
- **Stage branches** (this rebuild only): one branch per stage,
  `stage/<n>-<short-name>`, merged on stage approval.

### 8.2 Pull requests

- Squash-merge into `main`. The squashed message follows commit-message format.
- PRs are reviewable: target ≤ 400 lines of meaningful diff (excluding
  generated files and lockfiles). Larger changes split into a stack of PRs.
- A PR must include: what changed, why, screenshots/recordings for UI changes,
  test plan, and links to issues.
- A PR cannot merge while CI is red.
- CODEOWNERS gate merges to sensitive paths (`packages/database`, `apps/api`,
  CI files).

### 8.3 Commit message format

Conventional Commits.

```
<type>(<scope>): <subject>

<body — what & why, wrapped at 100 cols>

<footer — BREAKING CHANGE: ... / Refs #123>
```

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`,
  `build`, `ci`, `style`, `revert`.
- **Scope:** the touched area, kebab-case: `web`, `api`, `ui`, `database`,
  `checkout`, etc.
- **Subject:** imperative mood, no trailing period, ≤ 72 chars.
- **Body:** present where the "why" isn't obvious. Required for `feat` and
  `fix`.
- **Breaking changes** are noted with `BREAKING CHANGE:` footer **and** a `!`
  after the type (e.g. `feat(api)!: ...`).

Examples:

```
feat(checkout): add idempotency key to payment intent creation

Stripe occasionally retries on transient network errors; we now key on
Idempotency-Key so duplicate retries don't create duplicate intents.

Refs #142
```

```
fix(web): preserve scroll position when filter sheet closes
```

---

## 9. Testing Standards

- **Pyramid:** lots of unit + integration, fewer E2E. E2E covers user-critical
  flows only (browse → cart → checkout, login, admin create-product).
- **Co-location:** unit tests next to the code (`Foo.test.ts`).
- **Names:** `describe('Subject')` + `it('does X when Y')`. Test names read as
  English sentences.
- **One assertion per behaviour, not one per test** — group related expects
  inside one `it` if they describe the same behaviour.
- **No shared mutable state** across tests. Each test sets up its own world.
- **Fixtures live in `__fixtures__/`** next to the test using them; factories
  for entities live in `packages/database/test-factories/` (added Stage 3).
- **Mocking:**
  - Mock at the boundary (HTTP, time, randomness). Don't mock internals of the
    unit under test.
  - Time: use fake timers; never depend on wall clock.
  - Network: MSW in web/admin; supertest against the Nest app in api.
- **Coverage:** see `tech-stack.md` §17.5 — thresholds finalised Stage 11.
- **Flakes:** a flaky test is broken. Quarantine + fix within the same sprint;
  do not `.skip()` permanently.
- **E2E:** runs against a hermetic stack (Postgres + Redis in containers, S3
  emulator). No tests hit real third parties; webhooks are stubbed.

---

## 10. Documentation Standards

- All architecture and stage docs live in `docs/`. Markdown only. No PDFs,
  no Notion-only sources of truth.
- Every package has a `README.md` describing purpose, public surface, and
  consumption rules.
- Every API module has a doc in `docs/api/<module>.md` once it lands
  (Stage 6+). The doc owns: resource description, endpoints, request/response
  shapes, error codes, examples. Generated OpenAPI is a supplement, not a
  replacement.
- **TSDoc on public exports** of `packages/*`. Internals are documented only
  when the _why_ isn't evident.
- **No inline `WHAT` comments.** Comments explain _why_. If the code needs a
  comment to explain _what_, rename it.
- **ADRs (Architecture Decision Records)** for choices that we'll want to
  understand later: `docs/adr/NNNN-title.md`. Format: Context / Decision /
  Consequences. Used sparingly — for genuinely consequential decisions only.
- Diagrams: prefer ASCII in markdown for stability; use Mermaid when a real
  graph helps. No proprietary diagram formats committed to the repo.

---

## 11. Tooling & Enforcement

These are enforced — not just guidance — via `packages/config`:

- **ESLint** with rules covering: import boundaries (no cross-app imports, no
  deep imports), no `any`, no `console`, no hex literals outside tokens,
  React hook rules, accessibility (jsx-a11y), TanStack Query lint, no relative
  imports across feature/module boundaries.
- **Prettier** for formatting; single source of truth, no editor overrides.
- **Husky + lint-staged** on `pre-commit`: format + lint changed files.
- **`commitlint`** on `commit-msg`: enforces Conventional Commits.
- **`typecheck`** runs in CI on every PR; failure blocks merge.
- **`gitleaks`** runs in CI; secrets in diffs block merge.
- **Bundle size budgets** for `apps/web` and `apps/admin` checked in CI.

Anything not enforced by tooling is enforced by review. The reviewer is allowed
to block on any standard in this document.
