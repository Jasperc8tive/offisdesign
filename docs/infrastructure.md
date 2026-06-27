# Infrastructure

A topology overview of every component the platform expects to find in production.

## Components

| Component                      | Provider examples                               | Purpose                                            |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------- |
| Postgres 16+                   | Neon, Cloud SQL, RDS, Supabase                  | System of record (catalog, orders, customers, CMS) |
| Redis 7+                       | Upstash, ElastiCache, Render Redis              | Sessions, refresh-token JTI store, BullMQ, cache   |
| Object storage (S3-compatible) | AWS S3, Cloudflare R2, MinIO                    | Media uploads + backup destination                 |
| SMTP                           | Postmark, SendGrid, SES                         | Transactional email                                |
| CDN                            | Cloudflare, Fastly, CloudFront                  | Static + media delivery                            |
| Container registry             | GHCR (default), ECR, Docker Hub                 | Image distribution                                 |
| Reverse proxy / Ingress        | nginx-ingress, Traefik, the platform's built-in | TLS termination + routing                          |

## Process roles

| Role              | Image    | Replicas | Notes                                                       |
| ----------------- | -------- | -------- | ----------------------------------------------------------- |
| API server        | `api`    | 2+       | Stateless. Horizontally scalable.                           |
| Background worker | `worker` | 1+       | Consumes BullMQ. Scale on queue depth.                      |
| Storefront        | `web`    | 2+       | Stateless. Mostly static + SSR.                             |
| Admin             | `admin`  | 1        | Internal, can stay single-replica unless behind heavy load. |

The API and worker share `AppModule`; the worker simply boots the standalone Nest context (`apps/api/src/worker.ts`) instead of an HTTP listener. There's no risk of "what runs where" drift — every provider is wired identically.

## Network model

```
                       ┌──────────┐
public 443 ──→ ingress ┼─→ web    │
                       │   admin  │
                       │   api    │ ← also reached privately by web/admin
                       └──────────┘
                                         api ──→ postgres   (private)
                                         api ──→ redis      (private)
                                         api ──→ S3         (TLS, public)
                                         api ──→ SMTP       (TLS, public)
                                         api ──→ Stripe     (TLS, public)
                                         worker ──→ postgres, redis
```

The storefront and admin browsers call the API directly — there is no API gateway in front of it. Cookies are scoped to the parent domain (`COOKIE_DOMAIN=.offisdesign.com`).

## Environment templates

| Template                             | Where it lives                 | Audience      |
| ------------------------------------ | ------------------------------ | ------------- |
| `.env.example`                       | local dev                      | engineers     |
| `.env.production.example`            | secret manager input           | platform team |
| `apps/web/.env.production.example`   | `NEXT_PUBLIC_*` baked at build | platform team |
| `apps/admin/.env.production.example` | `NEXT_PUBLIC_*` baked at build | platform team |
| `k8s/secrets.example.yaml`           | Kubernetes Secret template     | platform team |

## Scaling guidance

- **API**: scale on CPU + p95 latency. The `HorizontalPodAutoscaler` in `k8s/api-deployment.yaml` is a starting point (70 % CPU target, 2 → 10 replicas).
- **Worker**: scale on queue depth. The dashboard `/operations/queues` shows live numbers; alert when `waiting` for a queue exceeds a tunable threshold.
- **Database**: vertically first (managed Postgres makes this a parameter change). Read replicas only when you've measured a real read bottleneck — premature read-replica routing burns complexity.
- **Redis**: a single node is usually fine; if it becomes a bottleneck the next step is a managed cluster, not sharding by hand.

## Inventory diagram

For an at-a-glance picture of what calls what, the storefront talks to the API which talks to Postgres/Redis/S3/Stripe/SMTP. The worker shares the same downstream dependencies but takes work from Redis (BullMQ) instead of HTTP.

## Cost levers

The three biggest knobs:

1. Image-derivative generation runs in the worker. Heavy throughput moves there before it lands in the API.
2. CDN egress for media is the dominant production line-item once you have product photography at scale.
3. Replica count on `web` is driven entirely by request volume; the storefront is stateless and aggressively cacheable.
