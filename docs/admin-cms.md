# Admin CMS

CMS administration lives under `apps/admin/app/cms/`. The Stage 13 cut delivers list + publish/archive for pages; visual block editing lands in Stage 14.

## Pages

`/cms/pages` lists every page with status, kind, and inline publish/archive actions:

- **List** — paginated table of `CmsPage` rows from `GET /v1/admin/cms/pages`.
- **Filter** — by status (`DRAFT`, `PUBLISHED`, `SCHEDULED`, `ARCHIVED`).
- **Actions** — `Publish` and `Archive` buttons inside each row. Both are wrapped in `<Can any={['cms:publish']}>` so editors without publish rights never see them.

## Permissions

| Action               | Required scope |
| -------------------- | -------------- |
| View pages list      | `cms:read`     |
| Create / edit page   | `cms:write`    |
| Publish / archive    | `cms:publish`  |
| Schedule publication | `cms:publish`  |

Backend already enforces these. The admin UI mirrors them via `<Can>` so disabled actions never render.

## Lifecycle

Pages move through a four-state lifecycle managed server-side:

```
DRAFT → SCHEDULED → PUBLISHED → ARCHIVED
   ↘————————————————↗            ↘— restored via API
```

- **Draft.** Not visible on the storefront. The default state for new pages.
- **Scheduled.** A `scheduledFor` timestamp drives the publish job; admin shows it as a separate status.
- **Published.** Live on the storefront. `publishedAt` is set server-side on the publish action.
- **Archived.** Soft-removed. Restorable via the API.

## Block editing (Stage 14)

CMS pages are composed of blocks (hero, copy, image-grid, testimonial, etc.) defined in the `CmsBlock` Prisma model. The admin can already publish/archive pages but does not yet expose:

- Block reordering (`POST /v1/admin/cms/pages/:id/blocks/reorder` already exists)
- Block CRUD inside a page
- Preview against the storefront
- Schedule modal (a date-picker against `scheduledFor`)

These are Stage 14 deliverables. The patterns to follow:

1. Page detail at `/cms/pages/[id]` reads the page including blocks (extend `cmsService.listPages` with a `get(id)`).
2. Block editor uses `<DataTable>`-style reordering with drag handles.
3. Preview opens the storefront at `${WEB_PUBLIC_URL}/p/${slug}?preview=token`. The token signs the draft via an admin-issued preview cookie.

## Other CMS entities

The backend exposes admin endpoints for the rest of the CMS surface:

- Blog posts + authors (`/v1/admin/cms/posts`, `/v1/admin/cms/authors`)
- Navigation (`/v1/admin/cms/navigation`)
- Announcements (`/v1/admin/cms/announcements`)
- Testimonials (`/v1/admin/cms/testimonials`)
- FAQs (`/v1/admin/cms/faqs`)

Stage 13 ships the page surface only. Each remaining entity follows the same `DataTable` + status-filter + `<Can>`-gated actions pattern; building them is mechanical.
