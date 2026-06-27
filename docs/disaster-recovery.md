# Disaster Recovery

The plan for losing things and getting them back.

## Targets

| Metric                    | Target           | How we hit it                                                           |
| ------------------------- | ---------------- | ----------------------------------------------------------------------- |
| RPO (data loss tolerated) | **≤ 1 hour**     | Hourly logical backups; managed Postgres PITR retains 7 days by default |
| RTO (downtime tolerated)  | **≤ 30 minutes** | Stateless app processes redeploy in minutes; restore is the slow path   |

Targets are owner-tunable: tighten the cron schedule and switch to streaming WAL archiving (e.g. `wal-g`) for sub-minute RPO; loosen the storage budget for cheaper backups.

## Inventory: what we back up

| Asset                 | Frequency                                               | Destination                       | Retention                     |
| --------------------- | ------------------------------------------------------- | --------------------------------- | ----------------------------- |
| Postgres logical dump | hourly (`scripts/backup.sh`, `k8s/cronjob-backup.yaml`) | S3 `s3://offisdesign-backups/db/` | 30 daily + provider lifecycle |
| Postgres PITR         | continuous (managed provider)                           | provider-native                   | provider default              |
| Media (S3)            | versioning + lifecycle rules                            | same bucket, separate prefix      | versioned for 30 days         |
| Audit log table       | included in Postgres dump                               | —                                 | —                             |
| Secrets               | secret-manager export (manual)                          | offline cold store                | annual rotation               |

What we **don't** back up: Redis. Sessions and refresh-token JTIs survive an outage by signing customers out; BullMQ jobs survive a worker restart but a full Redis loss means re-enqueuing recurring jobs from cron.

## Restore drills

Run quarterly. Document the date and outcome at the bottom of this file.

### 1. Database restore (full)

```
# 1. Provision a fresh target DB (managed UI / IaC).
# 2. Fetch the dump:
aws s3 cp s3://offisdesign-backups/db/db-YYYYMMDDTHHMMSSZ.sql.gz .
# 3. Restore into the target. The script refuses to drop anything — that's
#    on the operator.
DATABASE_URL=$RESTORE_TARGET_URL scripts/restore.sh db-YYYYMMDDTHHMMSSZ.sql.gz
# 4. Verify migration state.
DATABASE_URL=$RESTORE_TARGET_URL pnpm --filter @offisdesign/database migrate-status
# 5. Smoke test.
curl -fsS "${API_PUBLIC_URL}/v1/system/healthz"
```

### 2. Database restore (point-in-time)

Use the managed provider's PITR UI / CLI. Targets a wall-clock timestamp; the result is a fresh DB you swing `DATABASE_URL` to once verified.

### 3. Media restore

Object storage is versioned + lifecycle-managed; a `mv` or `rm` is reversible inside the retention window. Use `aws s3api list-object-versions` to find the prior version, `restore-object` for deep-archive tiers.

### 4. Full region failover

1. Re-create the Postgres + Redis in the new region (managed providers handle the DNS swap).
2. Run the API/worker/web/admin Deployments against the new endpoints (env-only change).
3. Cut DNS via the platform UI; TTL on the public records is 60 s in production.

## Runbook gates

Before declaring recovery complete:

- [ ] `GET /v1/system/healthz` returns `ok` on every replica.
- [ ] `GET /v1/system/readyz` returns 200 on every replica.
- [ ] Smoke test: create a draft product, place a guest checkout against the mock payment provider, view the resulting order in the admin.
- [ ] Search index reindex run (Stage 14 candidate `POST /v1/admin/ops/search/reindex`).
- [ ] Customers were not silently signed out beyond the refresh-token TTL (`JWT_REFRESH_TTL_SEC`).

## Past drills

| Date        | Owner | Outcome |
| ----------- | ----- | ------- |
| _(not yet)_ | —     | —       |

Append to this table after every real or rehearsed restore.
