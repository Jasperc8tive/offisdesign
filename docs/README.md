# Branch Furniture Rebuild — Documentation

Reverse-engineering audit + rebuild plan for a custom, Shopify-free, enterprise full-stack
re-implementation of branchfurniture.com.

## Stage status

- ✅ **Stage 1 — Website Analysis** (this set of docs)
- ✅ **Brand re-theme** (pre-Stage-2 gate) — visual identity moved to our own palette;
  canonical tokens created in `packages/ui/src/tokens/`. See [brand-retheme.md](brand-retheme.md).
- ✅ **Stage 2 — System Foundation & Architecture**
- ✅ **Stage 3 — Database Architecture, Domain Model & API Foundation** (awaiting approval)
- ⏸ Stage 4 — … Stage 15 — Deployment

## Stage 3 docs (complete, awaiting approval)

| Doc                                                              | What it covers                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [database-architecture.md](database-architecture.md)             | Locked decisions, IDs, audit/soft-delete, money, indexing, concurrency, search, lifecycle                                                      |
| [domain-model.md](domain-model.md)                               | 9 bounded contexts, aggregates, entities, VOs, invariants, cross-context refs                                                                  |
| [entity-relationship-diagram.md](entity-relationship-diagram.md) | ASCII ERDs per context with PK/FK/cardinality/cascade                                                                                          |
| [prisma-schema-design.md](prisma-schema-design.md)               | Per-model field/index/constraint plan for every table                                                                                          |
| [api-conventions.md](api-conventions.md)                         | Versioning, URLs, status codes, envelope, errors, pagination, filter/sort/search, idempotency, auth, validation, rate-limit, caching, webhooks |
| [rest-endpoints.md](rest-endpoints.md)                           | Full endpoint catalogue (storefront, account, auth, admin, webhooks, system) + permission registry                                             |
| [event-model.md](event-model.md)                                 | Domain event catalogue, envelope, delivery semantics, webhook surface, versioning                                                              |

## Stage 2 docs (complete, awaiting approval)

| Doc                                            | What it covers                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)             | System architecture, layering, request lifecycle, auth/authz, data flow, deployment topology, service boundaries, env strategy, security architecture |
| [monorepo-structure.md](monorepo-structure.md) | Full apps/packages/docker/scripts layout, dependency boundaries, import rules, path aliases                                                           |
| [tech-stack.md](tech-stack.md)                 | Every technology with why / alternatives / trade-offs / version constraints                                                                           |
| [coding-standards.md](coding-standards.md)     | Folders, naming, TS rules, components, API conventions, errors, logging, git, testing, docs, enforcement                                              |

## Stage 1 docs (complete)

| Doc                                                    | What it covers                                          |
| ------------------------------------------------------ | ------------------------------------------------------- |
| [website-architecture.md](website-architecture.md)     | High-level shape, surfaces, behavior model              |
| [page-map.md](page-map.md)                             | Full URL/link graph: collections, products, pages, blog |
| [routing.md](routing.md)                               | Next.js App Router route plan mirroring live URLs       |
| [design-system.md](design-system.md)                   | Consolidated design language + thesis                   |
| [color-system.md](color-system.md)                     | Real brand palette (sage/cream/blue/terracotta)         |
| [typography.md](typography.md)                         | Frank Ruhl Libre / Koulen / Quicksand + type scale      |
| [spacing-system.md](spacing-system.md)                 | 4px base scale, radii, container/layout                 |
| [responsive-breakpoints.md](responsive-breakpoints.md) | Breakpoint tiers + Tailwind mapping                     |
| [animations.md](animations.md)                         | Scroll-reveal/cascade motion + Framer plan              |
| [components.md](components.md)                         | Component inventory + reuse strategy                    |
| [seo.md](seo.md)                                       | Observed SEO + native rebuild plan                      |

## Deferred to later stages (intentionally not stubbed)

- Stage 3: `database-plan.md`, deep backend module designs, API endpoint catalogue, ERD
- Later: `performance.md`, `icons.md`, `future-improvements.md`

## Source material analyzed

- `index.html` (4.3 MB saved DOM) · `style.css` (brand tokens) · structure videos in
  `Website Homepage Structure/` · live site via fetch.

## Tech stack (target)

Next.js (App Router) · React · TypeScript · Tailwind · Framer Motion · shadcn/ui · RHF + Zod ·
TanStack Query · Lucide — NestJS · PostgreSQL · Prisma · Redis · JWT/RBAC — Docker · CI/CD ·
S3 storage · Vitest/Playwright/Jest.
