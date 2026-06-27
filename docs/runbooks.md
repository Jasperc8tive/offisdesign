# Runbooks

Short, scripted responses for the most likely incidents. Each runbook is structured the same way: **symptom → first check → triage → mitigation → root-cause → cleanup**.

Pin this page in `#oncall`. Update it whenever a real incident teaches you something the runbook missed.

---

## 1. API is down

**Symptom.** `GET /v1/system/livez` returns non-200, or every storefront page shows the error boundary.

1. **First check.** Pod status. `kubectl get pods -n offisdesign` / platform UI. CrashLoopBackOff ⇒ go straight to logs. Pending ⇒ scheduling / resource starvation.
2. **Triage.** `kubectl logs -n offisdesign -l app=offis-api --tail=200 --previous`. Look for a stack trace at boot — almost always config validation (`loadApiEnv` threw).
3. **Mitigation.** If a recent deploy: roll back the image via the platform UI. If config: patch the secret and restart.
4. **Root-cause.** Check the last release's diff. The release workflow tags images with `sha-<commit>`; correlate against the failing image.
5. **Cleanup.** Document the cause and the fix in this file as a new entry under "Past incidents."

## 2. Readiness flapping (503)

**Symptom.** `/v1/system/readyz` flips 200 ↔ 503; the storefront sees intermittent 502/503.

1. The endpoint returns 503 when DB, Redis, queue, or storage is degraded. Curl directly to see which check is failing.
2. **DB**: spike in `database` check failures usually means connection pool exhaustion. Check `DATABASE_POOL_MAX`; scale Postgres or raise the limit.
3. **Redis**: latency. Check Redis dashboard; consider scaling the managed plan.
4. **Queue**: Redis again, with BullMQ specifics. Quick mitigation: scale workers up so backlog clears.
5. **Storage**: S3 region degraded. Failover to a secondary region or accept the degradation window.

## 3. Stripe webhooks failing

**Symptom.** Admin queue dashboard shows failed jobs in `webhook-delivery`; orders stay PENDING after payment.

1. **First check.** Stripe dashboard → Webhooks → recent deliveries. 4xx ⇒ our problem; 5xx ⇒ Stripe's problem.
2. Verify `STRIPE_WEBHOOK_SECRET` matches the production webhook endpoint signing secret. Mismatch returns 401 from our HMAC verifier.
3. Use admin webhook replay (Stage 14 candidate `POST /v1/admin/webhooks/deliveries/:id/replay`) for one-offs.
4. If volume is high, pause new traffic via maintenance mode; replay the backlog; resume.

## 4. Queue backlog

**Symptom.** `GET /v1/admin/ops/queues` `waiting > 1000` for any queue.

1. Scale worker replicas. `kubectl scale deploy/offis-worker --replicas=N`.
2. If failures dominate, isolate the failing processor: each registered worker logs its name on boot. Disable via feature flag (`worker.<name>.enabled`).
3. Once cleared, scale back down to baseline.

## 5. Login broken

**Symptom.** Customers / staff can't sign in; rate-limit warnings in logs.

1. **First check.** Throttle. `RATE_LIMIT_AUTH` is 10/min for customer login and 10/min for admin (Stage 12). A sudden burst trips this. Inspect via a single `curl` — `Retry-After` header tells you the remainder.
2. If credentials are correct and not rate-limited, check `JwtAuthGuard` and `JWT_ACCESS_SECRET` rotation. A mismatch between the value in the running container and the one used to sign tokens immediately invalidates all sessions.
3. If you rotated secrets intentionally: communicate; users sign back in fresh.

## 6. Database connection storm

**Symptom.** Logs show `too many clients already`. Health degrades.

1. Inspect Prisma pool config and `DATABASE_POOL_MAX`.
2. Scale Postgres or cut API replicas. Each pod owns up to `DATABASE_POOL_MAX` connections; replicas × pool size is your true ceiling.
3. Mitigation: enable maintenance mode (`POST /v1/admin/ops/maintenance/on`) so the storefront serves a static "back shortly" page while you triage.

## 7. CSP violations

**Symptom.** Browser console reports `Refused to load…` from `js.stripe.com`, `cdn.offisdesign.com`, etc.

1. Inspect `apps/web/next.config.mjs`. CSP is set there; production allow-list lives at `script-src`, `connect-src`, `frame-src`, `img-src`.
2. Add the new origin to the smallest scope it needs.
3. Re-deploy. CSP is build-time; there's no hot toggle.

## 8. Backup didn't run

**Symptom.** Cron alert / missing object in the backup bucket.

1. Inspect the most recent `offis-db-backup` Job's logs.
2. Common cause: `DATABASE_URL` rotated and the CronJob's Secret wasn't refreshed. Re-roll the Secret, re-run the Job manually.
3. Document the gap window in the DR ledger (`docs/disaster-recovery.md`).

---

## Past incidents

| Date         | Symptom | Root-cause | Permanent fix |
| ------------ | ------- | ---------- | ------------- |
| _(none yet)_ | —       | —          | —             |

Append after every incident, even minor ones — the second time you see something is much faster when the first time is written down.
