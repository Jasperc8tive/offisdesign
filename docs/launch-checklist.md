# Launch Checklist

The single ordered list to walk through on launch day. Each item has an owner and a verification step. Tick items in order — do not skip.

## T-24h

- [ ] **Final RC1 build pushed to GHCR.** Owner: Eng lead. Verify: `docker pull ghcr.io/offisdesign/api:v1.0.0-rc.1` succeeds.
- [ ] **Production secrets populated.** Owner: Platform. Verify: `kubectl get secret offis-secrets -o jsonpath='{.data}' | jq 'keys'` lists every key from `.env.production.example`.
- [ ] **Database provisioned with PITR.** Owner: Platform. Verify: managed-provider UI shows automated backups + PITR window ≥ 7 days.
- [ ] **Redis provisioned with persistence.** Owner: Platform. Verify: `INFO persistence` shows `appendonly:yes`.
- [ ] **S3 bucket created with versioning + lifecycle.** Owner: Platform. Verify: `aws s3api get-bucket-versioning` returns `Enabled`.
- [ ] **Stripe live keys rotated into secrets.** Owner: Finance + Eng. Verify: `STRIPE_SECRET_KEY` starts with `sk_live_`.
- [ ] **Stripe webhook URL pointed at `api.offisdesign.com/v1/payments/webhook`.** Verify: Stripe → Webhooks → "Send test webhook" returns 200.
- [ ] **SMTP credentials verified.** Owner: Eng. Verify: a test mail lands in a real inbox.
- [ ] **DNS records pointed at the load balancer / ingress.** Owner: Platform. Verify: `dig +short` returns the new addresses.
- [ ] **TLS certificate provisioned for offisdesign.com, admin.offisdesign.com, api.offisdesign.com.** Verify: `curl -vI https://api.offisdesign.com` shows valid expiry > 30 days.

## T-12h

- [ ] **Run database migrations against production.** Owner: Eng. Command: `pnpm --filter @offisdesign/database db:migrate:deploy`. Verify: `pnpm --filter @offisdesign/database migrate-status` shows zero pending.
- [ ] **Seed super-admin account.** Owner: Eng. Verify: admin can sign in at `https://admin.offisdesign.com/login`.
- [ ] **Run a single backup to confirm scripts work in the prod environment.** Owner: Platform. Verify: `scripts/backup.sh` writes an object to S3.
- [ ] **Run a single restore drill against a scratch database.** Owner: Eng. Verify: post-restore `/v1/system/healthz` returns 200; record duration in `docs/disaster-recovery.md`.
- [ ] **Feature-flag review.** Owner: Eng. Verify: `payments.stripe.enabled = true`, `notifications.email.enabled = true`, `maintenance.enabled = false`.

## T-1h

- [ ] **All replicas reporting Ready.** Owner: Platform. `kubectl get pods -n offisdesign -o wide`.
- [ ] **`/v1/system/readyz` returns 200 on every API replica.** Owner: Platform.
- [ ] **Queue dashboard at `/operations/queues` shows zero failed jobs.** Owner: Eng.
- [ ] **Lighthouse CI on the production URLs: scores ≥ Stage 12 thresholds.** Owner: Eng.
- [ ] **Smoke test: place a £1 test order via Stripe test card.** Owner: QA. Verify: order appears in admin; receipt email lands.
- [ ] **Smoke test: customer registration, address add, wishlist toggle.** Owner: QA.
- [ ] **Smoke test: admin product publish + archive cycle.** Owner: QA.

## T-0 (launch)

- [ ] **Flip maintenance mode off** (if it was on for the cutover). `POST /v1/admin/ops/maintenance/off`.
- [ ] **Announce go-live in #ops and to stakeholders.** Owner: Eng lead.
- [ ] **Tail the API logs for 30 minutes.** Owner: On-call. Watch `level: error` count; alert if > baseline.

## T+1h

- [ ] **Real traffic seen on `/v1/system/healthz`.** Owner: On-call.
- [ ] **First customer order placed successfully.** Owner: Ops.
- [ ] **Stripe live dashboard shows successful charges.** Owner: Finance.

## T+24h

- [ ] **Review the first 24 hours of audit log.** Owner: Eng.
- [ ] **Verify the hourly backup ran every hour without gaps.** Owner: Platform.
- [ ] **Hold a launch retrospective.** Owner: Eng lead.

## Rollback criteria

Halt the launch and roll back if **any** of the following are true:

- Stripe live charges fail at > 1 % rate within the first hour.
- `/v1/system/readyz` returns 503 for > 5 minutes.
- Database connection storm — sustained `too many clients` errors.
- A customer reports a security incident (data exposure, account takeover).

Rollback procedure: see `docs/post-launch-runbook.md` §Rollback.
