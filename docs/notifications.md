# Notifications

Template-driven email (and future SMS / push) with delivery logging,
retry, and a provider abstraction.

## Aggregates

- `NotificationTemplate` — `{ key, channel, subject?, body, metadata?, isActive }`.
  `body` (and optional `subject`) are rendered against a JSON payload via the
  template engine described below.
- `NotificationDelivery` — append-only-ish row capturing every dispatched
  notification. Status transitions: `PENDING → SENT | FAILED | CANCELLED`.

## Template rendering

`renderTemplate(template, vars)` (see `apps/api/src/notifications/template.ts`)
substitutes `{{ name }}` and `{{ order.number }}`-style placeholders. Missing
keys render as `''` (no exceptions). Non-string values are JSON-serialised.

Intentionally minimal — richer rendering (loops, conditionals) can drop in
behind the same signature without touching call sites.

## Provider abstraction

```ts
interface EmailAdapter {
  name: string;
  send(msg: EmailMessage): Promise<{ id: string }>;
}
interface SmsAdapter {
  name: string;
  send(msg: SmsMessage): Promise<{ id: string }>;
}
interface PushAdapter {
  name: string;
  send(msg: PushMessage): Promise<{ id: string }>;
}
```

Bound to `EMAIL_ADAPTER`, `SMS_ADAPTER`, `PUSH_ADAPTER` Nest tokens.
`LogEmailAdapter` is the default — writes to the logger so dev environments
have zero external dependencies. Swapping to SMTP, SES, or Postmark is a
one-line provider rebind in `NotificationsModule`.

## Delivery flow

1. Application code (or admin) calls `NotificationsAppService.enqueue({
templateKey, recipient, payload })`. This writes a `PENDING` row keyed
   to the template.
2. The `notification-delivery` BullMQ cron (30 s) calls `processPending()`:
   reads up-to-100 PENDING rows, looks up the template, renders subject/body
   against the row's `payload`, and dispatches via the channel adapter.
3. Success → `SENT`, `sentAt`, provider id stored. Failure → `FAILED`, `error`
   captured, `attempts` incremented.
4. `POST /v1/admin/notifications/deliveries/:id/retry` flips a non-`SENT` row
   back to `PENDING` for the next worker tick.

## Endpoints (admin)

| Method | Path                                                                | Permission     |
| ------ | ------------------------------------------------------------------- | -------------- |
| GET    | `notifications/templates`                                           | `system:read`  |
| POST   | `notifications/templates`                                           | `system:audit` |
| PATCH  | `notifications/templates/:id`                                       | `system:audit` |
| DELETE | `notifications/templates/:id`                                       | `system:audit` |
| POST   | `notifications/enqueue`                                             | `system:audit` |
| GET    | `notifications/deliveries` (status/templateKey filters, pagination) | `system:read`  |
| POST   | `notifications/deliveries/:id/retry`                                | `system:audit` |

## Email transport configuration

Env keys (`EMAIL_TRANSPORT`, `EMAIL_FROM`, `SMTP_*`) gate provider selection.
Default is `log`. Real provider integrations (SMTP via nodemailer, SES,
Postmark, etc.) implement `EmailAdapter` and bind through
`NotificationsModule.providers` — no other module changes.

## Stage 6 wiring still applies

The customer module (`CustomerApplicationService`) calls
`emailAdapter.send` directly for transactional sends (verify email, reset
password). The template-driven flow lives alongside it and is the
recommended path for new notifications: it gets retry, delivery log, and
admin visibility for free.

## Out of scope (Stage 7)

- Recipient preference (do-not-email lists).
- A/B template variants.
- Real SMS / push adapters (interfaces exist, providers don't).
- Multi-locale templates.
- Webhook-style provider failure callbacks.
