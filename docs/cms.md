# CMS

Headless content engine. Storefront pages consume the same APIs an external
client would — no CMS logic in the Next.js layer.

## Bounded contexts

| Surface                          | Aggregates                                      |
| -------------------------------- | ----------------------------------------------- |
| Pages                            | `CmsPage` + `CmsBlock` (standard & landing)     |
| Blog                             | `BlogPost`, `Author`                            |
| Layout                           | `Navigation` (header/footer trees)              |
| Promos                           | `Announcement` (banner bar)                     |
| Social proof                     | `Testimonial`                                   |
| Support                          | `Faq`                                           |
| Hero / Banner / Marketing blocks | Live as `CmsBlock` payloads under landing pages |

## Status lifecycle

`DRAFT → PUBLISHED ⇄ ARCHIVED`, with `SCHEDULED` as a transitional state.

- `scheduledAt` — when a `SCHEDULED` row should auto-publish.
- `unscheduledAt` — when a `PUBLISHED` row should auto-unpublish.
- The `scheduled-publish` cron (60-second tick) flips both via the
  `JobsService` worker; status transitions remain idempotent.

## Optimistic concurrency

Every CMS aggregate (page, post) carries a `version` integer incremented on
every successful update. PATCH payloads must include the version the client
read. Mismatched writers see `409 STALE_VERSION`.

## Revisions

`RevisionService` keeps an append-only `content_revision` row per
`(aggregateType, aggregateId)` mutation. The application layer calls
`revisions.record({...})` after every meaningful change.

- Each row stores a full JSON `snapshot` plus a shallow `diff` against the
  previous version, suitable for an "Author X changed Title and Body" view.
- Restore by version is exposed at `POST /v1/admin/cms/pages/:id/restore/:version`
  — copies the snapshot back through the regular update path so version + slug
  conflicts surface cleanly.

## Endpoints

### Admin — `/v1/admin/cms/*` (JwtAuthGuard + RBAC)

| Path                                                                                      | Permission                               | Notes                                                   |
| ----------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `pages` (GET/POST)                                                                        | `cms:read` / `cms:write`                 | Paginated, with `status`, `q`, `includeDeleted` filters |
| `pages/:id` (GET/PATCH/DELETE)                                                            | `cms:read` / `cms:write`                 | PATCH requires `version`                                |
| `pages/:id/publish`                                                                       | `cms:publish`                            | Sets `publishedAt` if absent                            |
| `pages/:id/unpublish`                                                                     | `cms:publish`                            | → DRAFT                                                 |
| `pages/:id/schedule`                                                                      | `cms:publish`                            | Body `{ scheduledAt }` (future-only)                    |
| `pages/:id/archive`                                                                       | `cms:publish`                            | → ARCHIVED                                              |
| `pages/:id/restore/:version`                                                              | `cms:write`                              | Replays a stored snapshot                               |
| `pages/:id/blocks` (POST), `blocks/:id` (PATCH/DELETE), `pages/:id/blocks/reorder` (POST) | `cms:write`                              | Block CRUD + bulk reorder                               |
| `posts`, `posts/:id`, `posts/:id/{publish,unpublish,schedule}`                            | `cms:read` / `cms:write` / `cms:publish` | Blog mirrors page lifecycle                             |
| `authors` CRUD                                                                            | `cms:read` / `cms:write`                 |                                                         |
| `navigation` (GET/POST), `navigation/:key` (DELETE)                                       | `cms:read` / `cms:write`                 | Upsert by `key` (`header`, `footer`, …)                 |
| `announcements`, `testimonials`, `faqs` CRUD                                              | `cms:read` / `cms:write`                 | Flat lists                                              |

### Storefront — `/v1/storefront/cms/*`

| Path              | Notes                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `pages/:slug`     | Only `PUBLISHED`, soft-delete-aware. Cached 5 min per slug              |
| `posts` (GET)     | Public list — paginated; filter `status=PUBLISHED` enforced server-side |
| `posts/:slug`     | 5 min cache                                                             |
| `navigation/:key` | 5 min cache                                                             |
| `announcements`   | Live-window filter (`startsAt`/`endsAt`)                                |
| `testimonials`    | `isVisible = true` only                                                 |
| `faqs`            | `isVisible = true` only                                                 |

## Layering

```
AdminCmsController + StorefrontCmsController
   │
CmsApplicationService    (events + revisions + activity + cache invalidation)
   │
PageDomainService + BlogDomainService   (rules, slug allocation, status transitions)
   │
PageRepository + BlogRepository + AncillaryRepository
   │
Prisma (PostgreSQL)
```

Controllers never touch the repositories directly. Domain layer is
HTTP-agnostic and re-usable from CLI seeds or background jobs.

## Preview mode

Admin `GET /v1/admin/cms/pages/:id` returns the live row regardless of
status, which is what a preview iframe consumes. The public storefront
endpoint stays strictly `PUBLISHED`-only — there is no `?preview=1` flag
to leak draft content via the public surface.

## Out of scope (Stage 7)

- Multi-locale content. Schema is monolingual at launch.
- Workflow approvals / multi-author locking.
- Visual page builder UI (admin UI lands later).
- Static-site export.
