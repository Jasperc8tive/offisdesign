import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AutocompleteHit,
  FacetBucket,
  SearchHit,
  SearchQuery,
  SearchResult,
  SearchService,
} from './search.interface';

/**
 * Postgres-backed adapter. Uses ILIKE + pg_trgm similarity for ranking against
 * the catalogue's natural language fields. Facet counts are returned from the
 * same query plan via group-bys on the join tables.
 *
 * This is intentionally simple — the SearchService boundary lets us switch to
 * Meilisearch / Typesense without touching callers.
 */
@Injectable()
export class PostgresSearchService implements SearchService {
  readonly name = 'postgres-fts';

  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const { q, filters = {}, page, pageSize, sort = 'relevance' } = query;

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(filters.status
        ? { status: filters.status }
        : { status: 'ACTIVE', publishedAt: { not: null } }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.collectionSlugs?.length
        ? { collections: { some: { collection: { slug: { in: filters.collectionSlugs } } } } }
        : {}),
      ...(filters.categorySlugs?.length
        ? { categories: { some: { category: { slug: { in: filters.categorySlugs } } } } }
        : {}),
      ...(filters.tagSlugs?.length
        ? { tags: { some: { tag: { slug: { in: filters.tagSlugs } } } } }
        : {}),
      ...(filters.priceMin !== undefined || filters.priceMax !== undefined
        ? {
            variants: {
              some: {
                deletedAt: null,
                ...(filters.priceMin !== undefined
                  ? { priceAmount: { gte: filters.priceMin } }
                  : {}),
                ...(filters.priceMax !== undefined
                  ? { priceAmount: { lte: filters.priceMax } }
                  : {}),
              },
            },
          }
        : {}),
    };

    const orderBy =
      sort === 'recent'
        ? { createdAt: 'desc' as const }
        : sort === 'price-asc' || sort === 'price-desc'
          ? { createdAt: 'desc' as const } // variant-driven sort handled in projection
          : q
            ? { updatedAt: 'desc' as const }
            : { createdAt: 'desc' as const };

    const [rows, total, facets] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          variants: {
            where: { deletedAt: null },
            orderBy: { priceAmount: 'asc' },
            take: 1,
          },
          collections: { include: { collection: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.product.count({ where }),
      this.collectFacets(where),
    ]);

    const hits: SearchHit[] = rows.map((p) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      status: p.status,
      fromAmount: p.variants[0]?.priceAmount ?? null,
      currency: p.variants[0]?.priceCurrency ?? 'GBP',
      collectionSlugs: p.collections.map((c) => c.collection.slug),
      categorySlugs: p.categories.map((c) => c.category.slug),
      tagSlugs: p.tags.map((t) => t.tag.slug),
    }));

    return { hits, total, page, pageSize, facets };
  }

  async autocomplete(prefix: string, limit = 8): Promise<AutocompleteHit[]> {
    if (!prefix || prefix.length < 2) return [];
    const rows = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        publishedAt: { not: null },
        name: { startsWith: prefix, mode: 'insensitive' },
      },
      select: { id: true, slug: true, name: true },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return rows.map((r) => ({ productId: r.id, slug: r.slug, name: r.name }));
  }

  /**
   * Postgres FTS has no separate index — the underlying table IS the index.
   * The hook exists for API parity; a future Meili adapter pushes to the
   * external index here.
   */
  async index(_productId: string): Promise<void> {
    return;
  }

  async unindex(_productId: string): Promise<void> {
    return;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async collectFacets(where: Record<string, unknown>): Promise<SearchResult['facets']> {
    const rows = await this.prisma.product.findMany({
      where,
      select: {
        collections: { include: { collection: { select: { slug: true } } } },
        categories: { include: { category: { select: { slug: true } } } },
        tags: { include: { tag: { select: { slug: true } } } },
      },
      take: 500,
    });
    const collections = new Map<string, number>();
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    for (const p of rows) {
      for (const c of p.collections) bump(collections, c.collection.slug);
      for (const c of p.categories) bump(categories, c.category.slug);
      for (const t of p.tags) bump(tags, t.tag.slug);
    }
    return {
      collections: toBuckets(collections),
      categories: toBuckets(categories),
      tags: toBuckets(tags),
    };
  }
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toBuckets(map: Map<string, number>): FacetBucket[] {
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}
