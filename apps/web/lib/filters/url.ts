/**
 * Helpers for URL-driven discovery filters. Keeping serialization centralised
 * means the search page, collection page, and category page all stay in sync.
 */
export interface DiscoveryFilters {
  q?: string | undefined;
  collection?: string[] | undefined;
  category?: string[] | undefined;
  tag?: string[] | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  sort?: 'relevance' | 'recent' | 'price-asc' | 'price-desc' | undefined;
  page?: number | undefined;
}

const ARRAY_KEYS = ['collection', 'category', 'tag'] as const;

export function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const out: DiscoveryFilters = {};
  const q = params.get('q');
  if (q) out.q = q;
  for (const key of ARRAY_KEYS) {
    const values = params.getAll(key).filter(Boolean);
    if (values.length > 0) out[key] = values;
  }
  const pMin = Number(params.get('priceMin') ?? '');
  if (Number.isFinite(pMin) && pMin > 0) out.priceMin = pMin;
  const pMax = Number(params.get('priceMax') ?? '');
  if (Number.isFinite(pMax) && pMax > 0) out.priceMax = pMax;
  const sort = params.get('sort');
  if (sort === 'relevance' || sort === 'recent' || sort === 'price-asc' || sort === 'price-desc') {
    out.sort = sort;
  }
  const page = Number(params.get('page') ?? '');
  if (Number.isFinite(page) && page > 1) out.page = page;
  return out;
}

export function serializeFilters(filters: DiscoveryFilters): URLSearchParams {
  const next = new URLSearchParams();
  if (filters.q) next.set('q', filters.q);
  for (const key of ARRAY_KEYS) {
    const values = filters[key] ?? [];
    for (const v of values) next.append(key, v);
  }
  if (filters.priceMin) next.set('priceMin', String(filters.priceMin));
  if (filters.priceMax) next.set('priceMax', String(filters.priceMax));
  if (filters.sort) next.set('sort', filters.sort);
  if (filters.page && filters.page > 1) next.set('page', String(filters.page));
  return next;
}

export function toggleArrayFilter(
  filters: DiscoveryFilters,
  key: 'collection' | 'category' | 'tag',
  value: string,
): DiscoveryFilters {
  const current = filters[key] ?? [];
  const has = current.includes(value);
  const next = has ? current.filter((v) => v !== value) : [...current, value];
  return { ...filters, [key]: next.length > 0 ? next : undefined, page: undefined };
}

export function isActive(filters: DiscoveryFilters): boolean {
  return Boolean(
    filters.q ||
    filters.collection?.length ||
    filters.category?.length ||
    filters.tag?.length ||
    filters.priceMin ||
    filters.priceMax,
  );
}
