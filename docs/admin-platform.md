# Admin Platform

The Offisdesign admin app is a separate Next.js application at `apps/admin/`. It is a **pure consumer of the public admin APIs** — no database access, no business logic, no duplicated validation. Replace it with a different UI tomorrow and the backend keeps working.

## Architecture

```
apps/admin/
├── app/                       # Next.js App Router pages
│   ├── layout.tsx             # Root: <Providers> + <AdminShell>
│   ├── page.tsx               # Dashboard
│   ├── login/                 # Unauthenticated route
│   ├── catalog/products/      # Listing + detail
│   ├── orders/                # Listing + detail
│   ├── customers/             # Listing + profile
│   ├── cms/pages/             # Page management
│   └── operations/{flags,audit,queues}/
├── components/
│   ├── shell/                 # sidebar, header, breadcrumbs, command palette
│   ├── listing/data-table.tsx # reusable bulk-select table
│   ├── dashboard/stat-card.tsx
│   └── rbac.tsx               # <Can any={…}> permission gate
└── lib/
    ├── api/
    │   ├── client.ts          # fetch wrapper + 401 refresh + x-request-id
    │   ├── services.ts        # one function per backend endpoint
    │   ├── schemas.ts         # zod response shapes
    │   ├── config.ts
    │   └── errors.ts          # ApiError, NetworkError
    ├── providers/             # Query, Auth, Theme, Toaster
    └── format.ts              # money, dates, numbers
```

## Provider tree

```
<QueryProvider>
  <ThemeProvider>
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
      <Toaster />
    </AuthProvider>
  </ThemeProvider>
</QueryProvider>
```

`<AdminShell>` is the authentication gate. It reads `useAuth()`, redirects unauthenticated visitors to `/login?next=…`, and renders the sidebar/header/main composition for authenticated staff.

## API client

`lib/api/client.ts` mirrors the storefront client:

- Always-on `x-request-id` header so admin actions correlate with API and storefront traces.
- Cookie credentials included on every call.
- 401 triggers a single-flight `/v1/auth/refresh` replay; subsequent 401 surfaces as `ApiError`.
- `apiFetch(schema, opts)` validates responses with Zod — schema drift surfaces as a thrown contract error instead of silently shipping junk data.

## Shell

`components/shell/` composes:

- **Sidebar.** A static nav indexed by permission scope. Items the principal can't access never render — disabled actions are not allowed by Stage 13 rules.
- **Header.** Breadcrumbs (auto-derived from URL), command palette trigger, notifications stub, user avatar with role display, sign-out.
- **Command palette.** `⌘K` / `Ctrl+K`. Filters nav actions by the current principal's permissions. Keyboard-first: arrow keys + enter.
- **Breadcrumbs.** Computed from path segments; titles humanised at render time.

## RBAC

`lib/providers/auth.provider.tsx` exposes `can(...scopes)`:

```tsx
const { can } = useAuth();
can('catalog:write'); // true if principal has the scope or wildcard '*'
```

Use the `<Can any={['catalog:write']}>` component to gate UI:

```tsx
<Can any={['catalog:write']}>
  <Button>Publish</Button>
</Can>
```

Why `any` instead of `all`: most admin actions map to a single permission. Multi-scope checks are kept rare and explicit. The principal arrives from `/v1/auth/me` and contains `roles` + `permissions` arrays.

Every backend endpoint already enforces the same scope via `@RequirePermissions(...)`. The admin UI hide is a UX nicety — server enforcement is what actually protects the data.

## Data table

`components/listing/data-table.tsx` is the shared list primitive used by Products, Orders, Customers, CMS Pages, and Audit Log. Column declarations live at the call site; the component owns bulk selection (`selection={{ rowKey, selectedIds, onChange }}`), row click navigation, and loading skeletons.

## Architectural rules

1. **No business logic.** Pages orchestrate; sections compose; service functions are thin. Numbers, validation, and state transitions live in the API.
2. **No direct DB access.** The admin only sees `/v1/admin/*` (and a small set of shared endpoints like `/v1/checkout/orders`).
3. **No duplicated validation.** Zod schemas in `lib/api/schemas.ts` describe response shapes only. Request validation already happens server-side; we don't re-implement it on the client.
4. **Hide, don't disable.** Permission checks remove the surface instead of greying it out — users can never be confused about whether an action exists.
5. **Replaceable.** The admin is a thin client. The API is the product; this UI is one of many possible faces on it.
