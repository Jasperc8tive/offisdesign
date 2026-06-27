# Development Workflow

## Prerequisites

- Node 20.11+ (see `.nvmrc`).
- pnpm 9 (`corepack enable` picks this up automatically).
- Docker (for local Postgres + Redis).

## First-time setup

```bash
git clone <repo>
cd offisdesign
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d postgres redis
pnpm install
pnpm --filter @offisdesign/database db:generate
pnpm --filter @offisdesign/database db:migrate:dev
pnpm --filter @offisdesign/database db:seed
```

After `db:seed`, the super-admin email + password come from
`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` in your `.env`. If you
left the defaults, **rotate them now**.

## Day-to-day

| Want to …                  | Command                                         |
| -------------------------- | ----------------------------------------------- |
| Run the storefront         | `pnpm --filter @offisdesign/web dev`            |
| Run the admin              | `pnpm --filter @offisdesign/admin dev`          |
| Run the API                | `pnpm --filter @offisdesign/api dev`            |
| Run everything             | `pnpm dev` (turborepo `--parallel`)             |
| Storybook                  | `pnpm storybook`                                |
| Lint                       | `pnpm lint`                                     |
| Typecheck                  | `pnpm typecheck`                                |
| Tests                      | `pnpm test`                                     |
| Build                      | `pnpm build`                                    |
| Open Prisma Studio         | `pnpm --filter @offisdesign/database db:studio` |
| Reset the DB (destructive) | `pnpm --filter @offisdesign/database db:reset`  |

Turborepo caches everything — re-runs are sub-second when nothing changed.

## Editing the schema

1. Edit `packages/database/prisma/schema.prisma`.
2. `pnpm --filter @offisdesign/database db:migrate:dev --name <slug>` — Prisma
   writes the SQL migration and applies it locally.
3. Commit both the schema change **and** the new `prisma/migrations/<timestamp>/`
   folder in the same PR.
4. CI runs `prisma migrate deploy` against an ephemeral Postgres on every PR.

Never edit migrations after they've been pushed to `main`. If a migration is
wrong, write a follow-up migration.

## Adding a Nest module

1. `apps/api/src/<area>/<area>.module.ts` declares providers/controllers.
2. Provide infra via constructor injection (`PrismaService`, `RedisService`,
   `QueueService`, `StorageService`). They are global modules — no imports needed.
3. For protected endpoints: `@UseGuards(JwtAuthGuard, PermissionsGuard)` and
   `@RequirePermissions('domain:action')`.
4. For validated input: `@Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>`.

## Commit + branch hygiene

- Conventional commits — enforced by `commitlint` via the `commit-msg` Husky hook.
- `lint-staged` runs prettier + eslint --fix on staged files at commit time.
- PR titles follow the same convention; CI gates merges on lint, typecheck, tests, build.

## CI

`.github/workflows/ci.yml` jobs:

1. **install** — `pnpm install --frozen-lockfile` (sets the cache).
2. **lint** — `pnpm format:check && pnpm lint`.
3. **typecheck** — `pnpm typecheck`.
4. **test** — stands up Postgres + Redis service containers, runs `db:generate`,
   `db:migrate:deploy`, `db:seed`, then `pnpm test`.
5. **storybook** — `pnpm storybook:build`.
6. **build** — depends on the above; runs `db:generate` then `pnpm build`.

## Debugging

- `apps/api/src/main.ts` listens on `API_HOST:API_PORT`. Nest dev server
  supports `--inspect` via `NODE_OPTIONS=--inspect pnpm --filter @offisdesign/api dev`.
- Logs are pretty in development (pino + pino-pretty); switch by setting
  `LOG_LEVEL=debug`.
- Every log line carries a `requestId` matching the `x-request-id` response
  header — use it to correlate a browser request with API logs.

## VS Code

Recommended extensions live in `.vscode/extensions.json` (Prisma, ESLint,
Prettier, Tailwind CSS IntelliSense). Workspace settings enable format-on-save
with Prettier.
