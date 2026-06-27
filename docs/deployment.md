# Deployment

The Offisdesign platform ships as four container images. Pick whichever orchestrator your team already operates — the application is intentionally portable.

## Images

| Image    | Source Dockerfile          | Port | Purpose                          |
| -------- | -------------------------- | ---- | -------------------------------- |
| `api`    | `docker/Dockerfile.api`    | 4000 | NestJS HTTP server               |
| `worker` | `docker/Dockerfile.worker` | —    | BullMQ queue processor (no HTTP) |
| `web`    | `docker/Dockerfile.web`    | 3000 | Storefront (Next.js)             |
| `admin`  | `docker/Dockerfile.admin`  | 3001 | Back-office (Next.js)            |

All four images are multi-stage, run as a non-root `app` user, use `tini` as PID 1 so SIGTERM reaches Node, and ship a HEALTHCHECK. The `Release` workflow (`.github/workflows/release.yml`) builds and pushes them to GHCR.

## Provider notes

### Docker Compose (single node)

```
cp .env.production.example .env.production
cp apps/web/.env.production.example apps/web/.env.production
cp apps/admin/.env.production.example apps/admin/.env.production
docker compose -f docker/docker-compose.prod.yml up -d
```

Production-grade Postgres and Redis should be managed externally — point `DATABASE_URL` / `REDIS_URL` at your provider rather than running them in the same compose file.

### Kubernetes

Reference manifests live in `k8s/`. Apply order:

```
kubectl apply -f k8s/secrets.example.yaml         # after replacing placeholders
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/admin-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/cronjob-backup.yaml
```

Replicas, resource requests/limits, and HPA targets are starting points only — tune them against your actual traffic shape.

### Coolify / Railway / Render / Fly.io

All four images are vanilla OCI; any platform that consumes a Dockerfile or a pre-built image will host them. The patterns are identical:

1. Create a service per image (api, worker, web, admin).
2. Point env vars at `DATABASE_URL`, `REDIS_URL`, S3/Stripe/SMTP secrets.
3. For the API: configure the liveness probe at `GET /v1/system/livez` and readiness at `GET /v1/system/readyz`.
4. For the worker: no public port; only env.
5. Configure rolling deploys with **zero downtime** by ensuring `terminationGracePeriodSeconds` (or your platform's equivalent) is ≥ 30 s so Nest's shutdown hooks drain in-flight work.

We deliberately don't ship vendor-specific config files. The Dockerfiles are self-contained and produce the same artefact everywhere.

## Zero-downtime checklist

- Liveness probe ⇒ `GET /v1/system/livez` (always 200; tells the orchestrator the process is alive).
- Readiness probe ⇒ `GET /v1/system/readyz` (503 when DB/Redis/queue/storage degraded — pulls the pod out of the Service before requests fail).
- `app.enableShutdownHooks()` registered in `apps/api/src/main.ts` and `apps/api/src/worker.ts` so SIGTERM triggers `onModuleDestroy` on every provider (BullMQ drain, Prisma disconnect).
- `tini` as PID 1 in every image.
- Rolling deploy with `maxUnavailable: 0`, `maxSurge: 1`.

## Migration strategy

Run Prisma migrations from a **one-shot job** before promoting the new image — never inside the application boot. The repo exposes:

```
pnpm --filter @offisdesign/database db:generate
pnpm --filter @offisdesign/database db:migrate:deploy
```

In Kubernetes this is a `Job`; in Compose it's a `pnpm` invocation against the staged image; on Coolify/Railway/Render it's a deploy hook. Always run migrations first, _then_ swap traffic to the new image.

## Environments

Three logical environments: `local`, `staging`, `production`. Each lives in its own platform deployment with its own secret store. No config in code — the `loadApiEnv()` validator (`packages/config/src/env.ts`) refuses to boot when a required secret is missing.

See `docs/infrastructure.md` for the infrastructure inventory and `docs/disaster-recovery.md` for restore drills.
