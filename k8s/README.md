# Kubernetes reference manifests

These are **reference manifests** — minimal, opinionated, and not tied to a
specific cluster. Treat them as a starting point: copy into your own Helm
chart or kustomize overlay, then apply your team's policies (NetworkPolicy,
PodDisruptionBudget, resource limits, ServiceMonitor, etc).

Files:

| File                     | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `secrets.example.yaml`   | Template; populate via your secret manager |
| `api-deployment.yaml`    | API service + Deployment + HPA             |
| `worker-deployment.yaml` | BullMQ worker — no Service                 |
| `web-deployment.yaml`    | Storefront                                 |
| `admin-deployment.yaml`  | Back-office                                |
| `ingress.yaml`           | Public routes (TLS via cluster issuer)     |
| `cronjob-backup.yaml`    | Hourly DB backup → S3                      |

Apply order: `secrets → api → worker → web → admin → ingress → cronjob`.

Postgres and Redis are **not** included — production should use a managed
provider (Neon, Cloud SQL, RDS, Upstash). The manifests reference their
URLs through the `offis-secrets` Secret.
