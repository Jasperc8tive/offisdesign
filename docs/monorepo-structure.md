# Monorepo Structure

Stage 2 blueprint for the repository layout. This document defines folders,
package boundaries, and import rules. It does not implement any of them — files
listed below are _planned_, not yet created (except where noted).

Brand tokens (`#B81F34`, `#410C14`, `#350D13`, `#FEFEFE`) live in `packages/ui`
and are the only place hex values may be declared. Every other package consumes
them through the token API.

---

## 1. Top-level Layout

```
offisdesign/
├── apps/
│   ├── web/         # Customer storefront (Next.js App Router)
│   ├── admin/       # Back-office app (Next.js App Router)
│   └── api/         # NestJS HTTP API (sole business-logic owner)
├── packages/
│   ├── ui/          # Design tokens + shared React primitives
│   ├── config/      # Shared env loader, eslint/tsconfig/tailwind presets
│   ├── database/    # Prisma schema, migrations, generated client wrapper
│   ├── types/       # Cross-app TS types & API contract types
│   └── utils/       # Pure, framework-free helpers
├── docker/          # Dockerfiles + compose files per environment
├── docs/            # All architecture & stage documentation (this folder)
├── scripts/         # One-shot maintenance / dev scripts (TS, executable)
├── .github/         # CI workflows, issue/PR templates, CODEOWNERS
├── .changeset/      # Versioning + changelog inputs (if we adopt changesets)
├── package.json     # Workspace root; defines workspaces + repo scripts
├── pnpm-workspace.yaml
├── turbo.json       # Build pipeline (or nx.json — picked in Stage 14)
├── tsconfig.base.json
├── .editorconfig
├── .gitignore
├── .nvmrc
├── README.md
└── LICENSE
```

Notes:

- The root is a **pnpm workspace**. No nested `node_modules` are committed.
- A build orchestrator (Turborepo assumed; Nx is the documented alternative)
  is configured at the root; the choice is finalised in Stage 14.

---

## 2. `apps/`

Each app is a deployable. Apps may depend on `packages/*` but **never on each
other**. If two apps need the same thing, it goes into a package.

### 2.1 `apps/web` — storefront

```
apps/web/
├── app/                 # Next.js App Router segments (routes only)
├── features/            # Feature modules (catalog, cart, checkout, content…)
│   └── <feature>/
│       ├── components/  # Feature-scoped components
│       ├── hooks/       # Feature-scoped client hooks
│       ├── server/      # Server actions, server-only helpers
│       └── index.ts     # Public surface of the feature
├── lib/                 # App-local glue (api client, auth helpers, fetchers)
├── middleware.ts        # Edge middleware (locale, auth, headers)
├── public/              # Static assets (not media — media lives in S3)
├── styles/              # Tailwind entry + tiny app-level CSS
├── tests/               # App-level Playwright + integration tests
├── next.config.mjs
├── tailwind.config.ts   # Extends packages/config preset only
├── tsconfig.json        # Extends tsconfig.base.json
└── package.json
```

### 2.2 `apps/admin` — back-office

Same structure as `apps/web`. Smaller `features/` set focused on management
flows (catalog admin, orders, content, users). Auth gating is mandatory on
every route.

### 2.3 `apps/api` — NestJS service

```
apps/api/
├── src/
│   ├── main.ts                # Bootstrap
│   ├── app.module.ts          # Root composition
│   ├── common/                # Pipes, filters, interceptors, guards
│   ├── config/                # App-level config wiring (uses packages/config)
│   ├── modules/
│   │   └── <module>/          # One folder per bounded context (see architecture.md §8)
│   │       ├── <module>.module.ts
│   │       ├── <module>.controller.ts
│   │       ├── <module>.service.ts
│   │       ├── dto/           # Zod schemas + inferred DTO types
│   │       ├── domain/        # Entities, value objects, pure rules
│   │       ├── repositories/  # Prisma-backed repository implementations
│   │       └── events/        # Domain events (publishers + handlers)
│   └── infra/                 # Cross-cutting infrastructure adapters
│       ├── prisma/            # PrismaService (re-export from packages/database)
│       ├── redis/
│       ├── storage/           # S3 adapter
│       ├── mailer/
│       └── payments/
├── test/                      # Jest e2e tests
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 3. `packages/`

Packages are versioned together inside the monorepo. Public surface is what
they export from their `index.ts`; nothing else may be imported by consumers.

### 3.1 `packages/ui` — design system primitives

- Owns `src/tokens/` (the **only** place hex colour values live). Already exists.
- Owns shared React primitives (Button, Input, Card, etc.) once Stage 4 begins.
- Exports a Tailwind preset path (`./tailwind-preset`) for app configs to extend.
- Depends on: `packages/utils` only. **No app may import** from internals;
  consumers import from the package root.

### 3.2 `packages/config` — shared configuration

- Typed env loader with Zod schema (consumed by all three apps).
- Shared `eslint`, `prettier`, `tsconfig`, `tailwind` presets.
- Constants that are environment-shape (not values): variable names, defaults.
- Depends on: nothing in this monorepo (except `packages/types` if needed).

### 3.3 `packages/database` — Prisma schema + client

- Owns `prisma/schema.prisma` and `prisma/migrations/`.
- Exports a thin `PrismaClient` factory and the generated types.
- **Only `apps/api` may import the runtime client.** Other consumers may import
  _types_ only.
- Schema design itself is Stage 3 work — this package exists structurally now.

### 3.4 `packages/types` — cross-app contracts

- API request/response types (derived from Zod DTOs).
- Shared enums and domain-level types that need to cross app boundaries.
- No runtime code beyond Zod schemas. No React. No Node-only APIs.

### 3.5 `packages/utils` — pure helpers

- Framework-free, side-effect-free utilities (date, money, slug, formatting).
- 100% unit-tested; if it isn't pure, it doesn't belong here.

---

## 4. `docker/`, `scripts/`, `docs/`

- `docker/` — one Dockerfile per app, plus `docker-compose.yml` for local
  Postgres + Redis + S3 emulator. Production compose / k8s manifests live in
  the infra repo or under `docker/prod/` (decided Stage 15).
- `scripts/` — TypeScript-only operational scripts (seed, generate, migrate,
  rotate-keys). Each script is self-contained and runnable via `pnpm exec tsx`.
  No bash beyond a thin entrypoint.
- `docs/` — every architectural, stage, and design document. Markdown only.
  This folder is the project's memory.

---

## 5. Dependency Boundaries

The dependency graph is strict and one-way.

```
                ┌──────────────┐
                │ packages/    │
                │   utils      │◀──────────────┐
                └──────┬───────┘               │
                       │                       │
        ┌──────────────┴──────────────┐        │
        ▼                             ▼        │
┌──────────────┐              ┌──────────────┐ │
│ packages/    │              │ packages/    │ │
│   types      │◀─────────────│   config     │ │
└──────┬───────┘              └──────┬───────┘ │
       │                             │         │
       │       ┌─────────────────────┘         │
       ▼       ▼                               │
┌──────────────────┐                           │
│ packages/        │   (runtime client only    │
│   database       │    imported by apps/api)  │
└──────┬───────────┘                           │
       │                                       │
       ▼                                       │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  apps/api    │    │  apps/web    │    │ apps/admin   │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                           │                   │
                           ▼                   ▼
                    ┌──────────────────────────────┐
                    │ packages/ui  (React + tokens)│
                    └──────────────────────────────┘
```

**Hard rules:**

1. Apps never import from each other.
2. Packages never import from apps.
3. `packages/utils` depends on nothing in the workspace.
4. `packages/ui` depends only on `utils` (and React/Tailwind as peer deps).
5. `packages/database`'s runtime client is imported by `apps/api` only.
   `apps/web` and `apps/admin` may import its _types_ but never instantiate it.
6. `apps/web` and `apps/admin` reach Postgres **only** through `apps/api`.
7. No package may import from another package's internal paths
   (`packages/ui/src/...`). Public entry points only.
8. No circular dependencies — enforced by lint.

---

## 6. Import Rules (enforced by ESLint)

Concrete lint rules will be configured in `packages/config`. The intent:

- **Layering inside `apps/api`:** controllers may import services; services may
  import domain + repositories + infra; domain may import nothing
  framework-specific; repositories may import Prisma. Violations fail lint.
- **App-internal:** route segments may import features and `packages/ui`;
  features may import each other only through their `index.ts`; no deep imports.
- **Cross-package:** only from a package's published entry (`@offisdesign/ui`,
  not `@offisdesign/ui/src/...`).
- **No hex colours** outside `packages/ui/src/tokens/`. Lint rule rejects
  hex literals in components and styles.
- **No `any`** in committed code outside `*.test.ts` and explicit boundary
  adapters (must include a comment justifying it).
- **No relative imports** across feature or module boundaries; use TS path
  aliases declared in `tsconfig.base.json`.

---

## 7. Path Aliases (planned)

Declared once in `tsconfig.base.json`, inherited by every app and package:

```
@web/*        →  apps/web/*
@admin/*      →  apps/admin/*
@api/*        →  apps/api/src/*
@ui           →  packages/ui
@config       →  packages/config
@db           →  packages/database
@types        →  packages/types
@utils        →  packages/utils
```

The `@ui` / `@config` / etc. aliases resolve to the **package entry point**,
never to internal files. Apps use aliases; packages use relative imports
within themselves.

---

## 8. Repo Hygiene

- Single committed `pnpm-lock.yaml`. No other lockfiles.
- One Node version pinned in `.nvmrc` and `engines`.
- All scripts standardised at the root: `pnpm dev`, `pnpm build`, `pnpm test`,
  `pnpm lint`, `pnpm typecheck`, `pnpm format`. Each delegates to the build
  orchestrator.
- Every package has its own `README.md` describing its purpose and public
  surface. If a package isn't documented, it doesn't get merged.
