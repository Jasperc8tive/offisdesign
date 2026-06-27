# Catalog

The catalogue domain. Implements products, variants, options, collections,
categories, tags, specifications, documents, and product-to-product links.

## Layering

```
Controller        admin-catalog.controller.ts      storefront-catalog.controller.ts
   │                            │                              │
Application       catalog.app.ts (CatalogApplicationService)
   │                            │
Domain            product.domain.ts · collection.domain.ts · category.domain.ts
   │                            │
Repository        product · variant · collection · category · tag repositories
   │                            │
Database          Prisma (PostgreSQL)
```

- **Controllers** never contain business logic. They validate input (Zod),
  delegate to the application service, attach the actor's `Principal`.
- **Application service** orchestrates: calls domain, emits domain events,
  invalidates cache. This is the only layer that knows about cross-cutting
  concerns.
- **Domain services** hold the business rules: slug allocation, version checks,
  archive/publish transitions, SKU uniqueness, compare-at validity.
- **Repositories** are thin Prisma wrappers. No validation, no orchestration.

## Entities

| Entity                             | File                                          | Notes                                                                                                 |
| ---------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Product                            | `product.repository.ts` + `product.domain.ts` | Status DRAFT / ACTIVE / ARCHIVED; soft-delete via `deleted_at`; optimistic concurrency via `version`. |
| ProductVariant                     | `variant.repository.ts`                       | SKU unique; `priceAmount` (minor units) + `priceCurrency`; `compareAtAmount` for sale display.        |
| ProductOption / ProductOptionValue | included in product include                   | Defines the option matrix (Wood, Size); variants are tagged with `ProductVariantOption`.              |
| ProductMedia                       | join table referencing Media                  | Ordered via `position`.                                                                               |
| ProductSpecification               | new in Stage 5                                | Key/label/value rows (spec sheet). Unique `(productId, key)`.                                         |
| ProductDocument                    | new in Stage 5                                | Downloadable docs (PDFs etc.), join to Media.                                                         |
| ProductLink                        | per Stage 3                                   | Typed (`RELATED`, `CROSS_SELL`, `UP_SELL`); unique `(from, to, kind)`.                                |
| Collection                         | `collection.repository.ts`                    | Soft-deletable; `isVisible` controls storefront exposure.                                             |
| Category                           | `category.repository.ts`                      | Parent-child tree; soft-delete with `SetNull` on parent.                                              |
| Tag                                | `tag.repository.ts`                           | Flat; deleted hard (small ref count).                                                                 |

## Slugs

`apps/api/src/common/slug.ts` provides `slugify` and `uniqueSlug`. Slug
allocation:

- If the caller supplies a slug, the domain layer verifies it's free; conflict
  → 409 `SLUG_TAKEN`.
- Otherwise the domain layer generates `slugify(name)` then walks `name-2`,
  `name-3`, … until free.

## Status lifecycle

- `DRAFT` — newly created, not visible to storefront.
- `ACTIVE` — visible. Setting `ACTIVE` for the first time sets `publishedAt`
  to `now()`; subsequent toggles preserve the timestamp.
- `ARCHIVED` — no longer visible. Distinct from soft-delete (`deletedAt`) so
  business can keep ARCHIVED rows around for analytics.

Publishing rules:

- A product can only be published when it has at least one non-deleted variant.
- Re-publish of an ARCHIVED product is allowed but requires a fresh
  PATCH `status: ACTIVE` call (no implicit unarchive).

## Optimistic concurrency

`Product.version` increments on every successful update. PATCH calls must pass
the version they read. Server-side `updateMany({ where: { id, version } })`
returns count 0 on mismatch → 409 `STALE_VERSION` with the current version so
the client can reconcile.

## Storefront vs admin

| Concern     | Storefront                                                                     | Admin                                                                            |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Auth        | none                                                                           | `JwtAuthGuard + PermissionsGuard`                                                |
| Permissions | n/a                                                                            | `catalog:read` (list/get), `catalog:write` (mutations)                           |
| Visibility  | only `ACTIVE` + `publishedAt != null`, `deletedAt = null`, visible collections | full visibility incl. drafts, archived, soft-deleted (via `includeDeleted=true`) |
| Caching     | product-by-slug & collection-by-slug cached 5 min in Redis                     | none                                                                             |

## REST endpoints

### Storefront — `/v1/storefront/catalog/*`

| Method | Path                | Notes                                                                            |
| ------ | ------------------- | -------------------------------------------------------------------------------- |
| GET    | `products`          | Filters: `q`, `collection`, `category`, `tag`, `sort` (recent/name), pagination. |
| GET    | `products/:slug`    | Returns published only.                                                          |
| GET    | `collections`       | Visible collections, paginated.                                                  |
| GET    | `collections/:slug` | 404 if hidden / soft-deleted.                                                    |
| GET    | `categories`        | Full tree.                                                                       |

### Admin — `/v1/admin/catalog/*`

Products: `GET products`, `POST products`, `PATCH products/:id`,
`POST products/:id/publish`, `POST products/:id/archive`, `DELETE products/:id`.

Variants: `POST products/:productId/variants`, `PATCH variants/:id`,
`DELETE variants/:id`.

Collections: `GET collections`, `POST collections`, `PATCH collections/:id`,
`DELETE collections/:id`,
`POST collections/:collectionId/products/:productId` (attach),
`DELETE collections/:collectionId/products/:productId` (detach).

Categories: `GET categories`, `POST categories`, `PATCH categories/:id`,
`DELETE categories/:id`.

## Caching

- Key shape: `cat:product:slug:<slug>` · `cat:collection:slug:<slug>` ·
  `cat:category:tree`.
- TTL: 5 minutes for product / collection details.
- Invalidation: every catalogue write that touches a slug invalidates the key
  in the application service AND emits a domain event so the JobsService can
  cross-invalidate caches that depend on it.

## Events emitted

`product.created`, `product.updated`, `product.published`, `product.archived`,
`product.deleted`, `collection.updated`, `category.updated`, `price.changed`.
Listener wiring is in `jobs/jobs.service.ts`.

## Out of scope (Stage 5)

- Admin UI for product editing.
- Storefront pages — only `/v1/storefront/catalog/*` JSON endpoints exist.
- Bulk import / export.
- Multi-currency catalogue (single currency at launch, infrastructure ready).
