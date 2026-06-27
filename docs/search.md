# Search

The catalogue's search surface. The interface is fixed for the life of the
project; the implementation is swappable.

## Interface

`apps/api/src/search/search.interface.ts` defines:

```ts
interface SearchService {
  name: string;
  search(query: SearchQuery): Promise<SearchResult>;
  autocomplete(prefix: string, limit?: number): Promise<AutocompleteHit[]>;
  index(productId: string): Promise<void>;
  unindex(productId: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

Bound to the `SEARCH_SERVICE` symbol via NestJS DI. Feature code depends only
on the interface — switching to Meilisearch or Typesense in a later stage
swaps the provider binding in `search.module.ts`.

## Initial implementation — Postgres

`PostgresSearchService` uses Prisma against the existing catalogue tables.

Query strategy:

- ILIKE against `name`, `slug`, `description` (case-insensitive contains).
- Filters: `status`, `collectionSlugs`, `categorySlugs`, `tagSlugs`,
  `priceMin`/`priceMax` (joins through `variants`).
- Sort: `relevance` (default, falls back to `updatedAt desc`), `recent`,
  `price-asc`, `price-desc`.
- Pagination: `page` + `pageSize` (max 50 storefront).

Storefront default filters: `status=ACTIVE`, `publishedAt != null`,
`deletedAt = null`.

`index()` and `unindex()` are no-ops for this adapter — the underlying table
_is_ the index. They exist for API parity so a future Meili/Typesense adapter
can push to the external index without changing call sites.

## Facets

`SearchResult.facets` returns `{ collections, categories, tags }`, each as an
array of `{ value, count }` buckets sorted by count desc. Implementation joins
the result set with the cross-context tables and aggregates counts in-process.
For sets larger than 500 we batch — feature stages can swap in an external
index for sub-second facet counts on large catalogues.

## Autocomplete

`autocomplete(prefix, limit=8)` returns up to N hits matching the start of
`name` (case-insensitive). Minimum prefix length is 2. Only ACTIVE,
published, non-deleted products participate.

## REST endpoint (storefront)

| Method | Path                                 | Notes                                                                                                         |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| GET    | `/v1/storefront/search`              | Query params: `q`, `collection[]`, `category[]`, `tag[]`, `priceMin`, `priceMax`, `sort`, `page`, `pageSize`. |
| GET    | `/v1/storefront/search/autocomplete` | Params: `q`, `limit`.                                                                                         |

No admin endpoint — admin search reuses the catalogue admin endpoints with
`q`.

## Eventual upgrade path

When traffic outgrows Postgres FTS:

1. Drop in `MeilisearchService implements SearchService` next to
   `PostgresSearchService`.
2. Rebind `SEARCH_SERVICE` in `search.module.ts`.
3. The `search-index` BullMQ queue (already wired in `jobs/jobs.service.ts`) is
   how product writes flow into the external index — same producer code, new
   consumer.

No controller or feature-service changes required.
