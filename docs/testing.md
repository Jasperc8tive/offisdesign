# Testing

Stage 4 lands the testing **foundation**. Concrete feature tests come with the
features themselves.

## Tooling

| Layer                  | Tool           | Where                                    |
| ---------------------- | -------------- | ---------------------------------------- |
| API unit + integration | Jest + ts-jest | `apps/api`                               |
| Library unit           | Vitest         | `packages/utils`, future `packages/*`    |
| E2E (planned)          | Playwright     | `apps/web` once storefront features land |

The split is intentional: Jest matches NestJS conventions for backend code,
Vitest matches the Vite ecosystem the UI/Storybook stack already uses.

## Running

```bash
pnpm test                # turbo run test — every package's test script
pnpm --filter @offisdesign/api test
pnpm --filter @offisdesign/api test:watch
pnpm --filter @offisdesign/api test:cov
```

## API tests (Jest)

- Config lives in `apps/api/package.json` under `jest`.
- File pattern: `*.spec.ts` colocated with source.
- ts-jest transforms TypeScript on the fly — no separate build step.
- Coverage report writes to `apps/api/../coverage` (i.e. `apps/coverage`).

Sanity example: `apps/api/src/auth/password.service.spec.ts` exercises
bcrypt round-trip without DI bootstrap.

### Conventions

- Pure services: instantiate directly with mocked deps. Avoid `Test.createTestingModule`
  unless you need lifecycle hooks.
- Integration: spin up a real Postgres + Redis via Docker Compose, point at a
  scratch DB (`offisdesign_test`), run `db:migrate:deploy && db:seed`, then run
  Jest. CI does this end-to-end.
- Snapshot tests: only for deterministic JSON shapes (error envelopes, OpenAPI
  output).

## Library tests (Vitest)

- Config: zero — vitest discovers `**/*.{test,spec}.ts(x)`.
- `pnpm --filter @offisdesign/utils test` runs the suite. CI runs it as part of
  `pnpm test`.

Sanity example: `packages/utils/src/cn.test.ts`.

## Test database

- Connection string: `postgresql://offis:offis@localhost:5432/offisdesign_test?schema=public`.
- The CI workflow stands up a Postgres 16 service container, exports
  `DATABASE_URL` to point at it, and runs migrations + seed before tests.
- Locally, replicate by running `pnpm --filter @offisdesign/database db:migrate:dev`
  against a separate `offisdesign_test` schema, or use `db:reset` between runs.

## Mock factories

Lands incrementally — feature stages add `*.fixture.ts` modules colocated with
the code they exercise. The rule of thumb: factories belong with the
aggregate they construct, not in a shared `/test` directory.

## Coverage reporting

`test:cov` writes lcov + html under `apps/coverage`. CI doesn't gate on
coverage thresholds yet — those land alongside feature work where the bar can
be set meaningfully per module.

## Playwright

Configured **skeletally** — installed and wired into CI when a critical-path
flow exists worth exercising end-to-end (login → checkout). Until then, the
`(design)` route group is enough to validate UI composition manually.
