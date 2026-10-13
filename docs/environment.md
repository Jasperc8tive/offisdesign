# Environment

All configuration enters the app via environment variables (12-factor). The
authoritative schema lives in `packages/config/src/env.ts` as Zod schemas;
invalid configuration crashes the API at boot with a precise message.

Local defaults are documented in `.env.example` at the repo root.

## Environments

| `APP_ENV` | Where              | Notes                                                               |
| --------- | ------------------ | ------------------------------------------------------------------- |
| `local`   | Developer machine  | `.env` consumed at boot; `pino-pretty` logs.                        |
| `dev`     | Shared dev cluster | JSON logs; `OPENAPI_ENABLED=true` so `/docs` is reachable.          |
| `staging` | Pre-prod cluster   | Production secrets analogues; `OPENAPI_ENABLED` typically false.    |
| `prod`    | Production         | `COOKIE_SECURE=true`, `SameSite=Strict` (override), no pretty logs. |

`NODE_ENV` controls runtime mode (`development | test | production`); `APP_ENV`
controls _which_ deployment we're in. The two are independent.

## API variables

### Server

| Key                | Default                 | Purpose                     |
| ------------------ | ----------------------- | --------------------------- |
| `API_PORT`         | `4000`                  | Listen port.                |
| `API_HOST`         | `0.0.0.0`               | Listen host.                |
| `API_PUBLIC_URL`   | `http://localhost:4000` | Used in OpenAPI server URL. |
| `WEB_PUBLIC_URL`   | `http://localhost:3000` | CORS allowlist.             |
| `ADMIN_PUBLIC_URL` | `http://localhost:3001` | CORS allowlist.             |

### Database

| Key                 | Required | Purpose                                                               |
| ------------------- | -------- | --------------------------------------------------------------------- |
| `DATABASE_URL`      | yes      | Prisma + migrations.                                                  |
| `DATABASE_POOL_MAX` | `10`     | Reserved for explicit pool wiring (Prisma manages a pool by default). |

### Redis

| Key         | Required | Purpose                                       |
| ----------- | -------- | --------------------------------------------- |
| `REDIS_URL` | yes      | Cache, refresh token store, BullMQ backplane. |

### Auth

| Key                   | Default              | Purpose                        |
| --------------------- | -------------------- | ------------------------------ | --- | ------ |
| `JWT_ACCESS_SECRET`   | required (≥32 chars) | HS256 secret for access JWTs.  |
| `JWT_ACCESS_TTL_SEC`  | `900`                | 15 min.                        |
| `JWT_REFRESH_SECRET`  | required (≥32 chars) | HS256 secret for refresh JWTs. |
| `JWT_REFRESH_TTL_SEC` | `2592000`            | 30 d.                          |
| `COOKIE_DOMAIN`       | —                    | Optional cookie domain.        |
| `COOKIE_SECURE`       | `false`              | `true` in prod.                |
| `COOKIE_SAMESITE`     | `lax`                | `strict                        | lax | none`. |
| `BCRYPT_ROUNDS`       | `12`                 | Higher = slower (8–15).        |

### Rate limit

| Key                  | Default | Purpose                                |
| -------------------- | ------- | -------------------------------------- |
| `RATE_LIMIT_DEFAULT` | `120`   | Per IP per minute (Throttler default). |
| `RATE_LIMIT_AUTH`    | `10`    | Auth endpoints; tighter.               |

### Storage

| Key                                                                                                             | Default                       | Purpose                            |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------- | ---- |
| `STORAGE_DRIVER`                                                                                                | `local`                       | `local                             | s3`. |
| `STORAGE_LOCAL_DIR`                                                                                             | `./.storage`                  | Filesystem root when local.        |
| `STORAGE_PUBLIC_BASE_URL`                                                                                       | `http://localhost:4000/media` | Where public assets are served.    |
| `S3_BUCKET` / `S3_REGION` / `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_FORCE_PATH_STYLE` | —                             | Required when `STORAGE_DRIVER=s3`. |

### Queues

| Key                      | Default | Purpose                            |
| ------------------------ | ------- | ---------------------------------- |
| `QUEUE_PREFIX`           | `offis` | Redis key prefix for BullMQ.       |
| `QUEUE_DEFAULT_ATTEMPTS` | `5`     | Default retry attempts before DLQ. |

### OpenAPI

| Key               | Default | Purpose                    |
| ----------------- | ------- | -------------------------- |
| `OPENAPI_ENABLED` | `true`  | Mounts `/docs` Swagger UI. |

### Tax and shipping

All amounts are minor units (kobo, ₦ × 100).

| Key                          | Default | Purpose                                                              |
| ---------------------------- | ------- | -------------------------------------------------------------------- |
| `TAX_FLAT_RATE_BPS`          | `750`   | Flat VAT in basis points (7.5%). Goods are taxed after discounts.    |
| `SHIPPING_FLAT_AMOUNT`       | `0`     | Standard delivery price.                                             |
| `SHIPPING_FREE_THRESHOLD`    | unset   | Subtotal at or above which standard delivery is free. Unset = never. |
| `SHIPPING_EXPRESS_SURCHARGE` | `0`     | Added to standard for Express. `0` hides the Express option.         |

### Seed

| Key                         | Default                   | Purpose                   |
| --------------------------- | ------------------------- | ------------------------- |
| `SEED_SUPER_ADMIN_EMAIL`    | `admin@offisdesign.local` | Seed target.              |
| `SEED_SUPER_ADMIN_PASSWORD` | `change-me-immediately`   | Rotate after first login. |

## Secret management

- Local: `.env` (gitignored, never committed).
- Dev / staging: encrypted-at-rest in the deployment provider's secret manager,
  injected at process start.
- Prod: separate, narrower access list; rotation cadence per the security
  runbook (lands in a later stage).
- Generate JWT secrets with `openssl rand -base64 48`.

## Validation

`loadApiEnv()` runs at boot. On failure, the process exits with a multi-line
report listing every missing/invalid key. There is no implicit fallback — the
schema is the contract.

Boolean flags accept `true/false`, `1/0`, `yes/no` and `on/off` (any case);
anything else is rejected rather than read as `false`. `APP_ENV=production`
is accepted as an alias of `prod`.

In production (`APP_ENV=prod` or `NODE_ENV=production`) the API also refuses
to boot unless:

- `PAYMENT_PROVIDER` is not `mock`
- `COOKIE_SECURE=true` and `COOKIE_DOMAIN` is set
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` differ and neither looks like a
  placeholder (`change-me`, `REPLACE…`, `example`, `placeholder`)
- `STORAGE_DRIVER=s3` and `EMAIL_TRANSPORT=smtp`
- `OPENAPI_ENABLED=false`
