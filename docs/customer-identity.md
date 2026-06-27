# Customer Identity

Registration, verification, password lifecycle, profile, addresses, and session
management for the shopper-facing identity surface. Admin identity is owned
by the existing `AuthModule` from Stage 4 — this document covers customers only.

## Aggregate

- `Customer` — email, password hash, verified-at, profile, soft-delete.
- `CustomerAddress` — multiple per customer, single `isDefault`.
- `CustomerSession` — owned by `AuthService` since Stage 4.
- `VerificationToken` — single table, discriminated by `kind`:
  - `EMAIL_VERIFICATION` (TTL 24h)
  - `PASSWORD_RESET` (TTL 1h)

Tokens are stored as **SHA-256 hex of the raw token**. The raw value is only
ever in transit (in the email body). A DB leak cannot be replayed.

## Endpoints (`/v1/customer`)

| Method | Path                      | Auth           | Notes                                                     |
| ------ | ------------------------- | -------------- | --------------------------------------------------------- |
| POST   | `register`                | none           | Creates the customer + issues an email-verification token |
| POST   | `verify-email`            | none           | Body `{ token }`. 204 on success                          |
| POST   | `request-password-reset`  | none           | Always 204 (anti-enumeration)                             |
| POST   | `complete-password-reset` | none           | `{ token, password }`; revokes all sessions               |
| GET    | `me`                      | JWT (customer) | Profile                                                   |
| PATCH  | `me`                      | JWT            | Update profile fields                                     |
| POST   | `me/change-password`      | JWT            | Requires current password                                 |
| POST   | `me/deactivate`           | JWT            | Soft-delete + revoke all sessions                         |
| GET    | `me/addresses`            | JWT            | List                                                      |
| POST   | `me/addresses`            | JWT            | Create — `isDefault: true` clears others                  |
| PATCH  | `me/addresses/:id`        | JWT            | Partial update — same rule                                |
| DELETE | `me/addresses/:id`        | JWT            | Soft-delete                                               |
| GET    | `me/sessions`             | JWT            | List non-revoked sessions                                 |
| DELETE | `me/sessions/:id`         | JWT            | Revoke a specific session                                 |

Login / refresh / logout / me-principal continue to use `/v1/auth/customer/*`
from Stage 4.

## Layering

```
CustomerController         (HTTP, validation only)
   │
CustomerApplicationService (events + emails + orchestration)
   │
CustomerDomainService      (rules: token issuance, password rotation, default-address invariant)
   │
CustomerRepository         (Prisma; no validation)
```

## Verification + reset tokens

- `generateToken()` returns `{ raw, hash }` — 32 random bytes encoded as
  base64url, plus a SHA-256 hex digest.
- The hash is persisted; the raw goes into the email link.
- Issuing a new token of the same kind for a customer marks all prior unused
  tokens as used (one in flight at a time).
- Token consumption is atomic via `markTokenUsed` — replays return 400
  `TOKEN_USED`.

## Anti-enumeration

`POST request-password-reset` always returns 204 regardless of whether the
email exists. The application service no-ops silently on unknown emails so a
caller can't probe the customer table.

## Domain events emitted

- `customer.registered` `{ customerId, email }`
- `customer.email-verified` `{ customerId, email }`
- (Password reset request is intentionally not eventified to avoid leaking
  whether the email exists into the event stream.)
- `customer.deactivated` `{ customerId }` — wired but not currently fired by
  this module; reserved for the admin-driven deactivation flow.

## Out of scope (Stage 6)

- Social / OAuth providers.
- Multi-factor authentication.
- Bulk session revoke from admin.
- GDPR data-export / hard-delete.
