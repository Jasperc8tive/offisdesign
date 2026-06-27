# Authentication

Stage 4 establishes the auth foundation. Registration flows are intentionally
deferred to feature stages — only login / refresh / logout / me are wired.

## Two principals, one mechanism

Customer and AdminUser are fully separate aggregates (Stage 3 locked rule).
Both authenticate with email + password, but each writes into its own session
table. The JWT carries `kind: 'admin' | 'customer'` so middleware and guards
never confuse the two.

## Endpoints (`/v1/auth/*`)

| Method | Path             | Body                  | Notes                                                   |
| ------ | ---------------- | --------------------- | ------------------------------------------------------- |
| POST   | `admin/login`    | `{ email, password }` | Issues access+refresh cookies; updates `last_login_at`  |
| POST   | `customer/login` | `{ email, password }` | Same shape; uses customer table                         |
| POST   | `refresh`        | (refresh cookie)      | Rotates the refresh JTI; updates the session row        |
| POST   | `logout`         | (refresh cookie)      | Revokes JTI in Redis + sets `revoked_at` on session row |
| GET    | `me`             | (access cookie)       | Returns the principal incl. roles + permissions         |

All four mutate cookies via `cookie.helper.ts`; no body is returned beyond the
principal summary.

## Tokens

- **Access token** — 15 min default (`JWT_ACCESS_TTL_SEC`). Payload: `{ sub, kind, sid }`.
- **Refresh token** — 30 d default (`JWT_REFRESH_TTL_SEC`). Payload includes a `jti`.
- Separate HS256 secrets per token type (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
  so an access secret leak doesn't invalidate refresh tokens.
- Both tokens travel in **HttpOnly** cookies (`offis_at`, `offis_rt`),
  `SameSite=Lax` by default, `Secure` when `COOKIE_SECURE=true`. Cookies share
  the same path and domain.

## Refresh token storage

Two-layer:

1. **Postgres** — `admin_session` / `customer_session` rows hold the canonical
   record (`refresh_token_jti`, `user_agent`, `ip_address`, `expires_at`,
   `revoked_at`). This is the source of truth for "this session existed".
2. **Redis** — `auth:refresh:<jti>` → `<sessionId>`, TTL = refresh TTL. This is
   the fast-path check for "is this JTI still valid".

Rotation is atomic via a pipelined `DEL old` + `SET new EX ttl` followed by the
DB update. Logout revokes both Redis entry and DB row.

## Password hashing

bcrypt with cost from `BCRYPT_ROUNDS` (default 12). `PasswordService` is the
only place that talks to bcrypt.

## Guard + principal

`JwtAuthGuard` reads the access token from the `offis_at` cookie (or `Authorization: Bearer`),
verifies it, then loads the principal's roles/permissions from Postgres
(admin only — customer permissions arrive in a later stage when the customer
loyalty model lands). It writes the resolved `Principal` to `req.principal` and
into the AsyncLocalStorage request context.

`@CurrentPrincipal()` is the parameter decorator used in controllers.

## RBAC

`@RequirePermissions('catalog:write')` on a controller method or class blocks
the request unless the principal owns **every** listed permission. Resource-
level decisions ("only your own order") go through `PolicyService.assertOwns`.

Roles seeded by `db:seed`:

| Role          | Use                                                                  |
| ------------- | -------------------------------------------------------------------- |
| `super_admin` | Break-glass; full access incl. `rbac:manage`.                        |
| `admin`       | Day-to-day ops; all permissions except `rbac:manage`.                |
| `staff`       | Catalogue + inventory + orders + customer (read) + CMS (no publish). |
| `viewer`      | Read-only across all operational domains.                            |

## Threat-model touchpoints

- Token leak: short access TTL + rotation on refresh + DB-backed session log
  means a stolen refresh token is detectable (revoked_at trail) and revokable.
- Brute force: ThrottlerGuard caps `/v1/auth/*` at `RATE_LIMIT_AUTH/min` per IP.
- Replay: refresh JTIs are one-time; rotation invalidates the old jti immediately.
- Privilege escalation: roles + permissions are joined on every request — no
  cached, stale role claims live in the access token.
- Information disclosure: error responses use a stable `code`/`message` shape
  so password/email enumeration responses are uniform (`INVALID_CREDENTIALS`).

## Out of scope (Stage 4)

- Registration flows (sign-up, email verification).
- Password reset flows.
- Social/OAuth providers.
- Multi-factor.
- Per-device session listing UI.

All of those build on top of the primitives delivered here.
