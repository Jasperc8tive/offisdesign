/**
 * SearchService — pluggable abstraction. Initial implementation is Postgres FTS;
 * a Meilisearch / Typesense adapter slots in behind the same interface.
 */

export interface SearchQuery {
  q?: string;
  filters?: SearchFilters;
  sort?: 'relevance' | 'recent' | 'price-asc' | 'price-desc';
  page: number;
  pageSize: number;
}

export interface SearchFilters {
  collectionSlugs?: string[];
  categorySlugs?: string[];
  tagSlugs?: string[];
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  /** Money minor units. */
  priceMin?: number;
  priceMax?: number;
}

export interface SearchHit {
  productId: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  /** Cheapest active variant. */
  fromAmount: number | null;
  currency: string;
  collectionSlugs: string[];
  categorySlugs: string[];
  tagSlugs: string[];
  /** Postgres FTS rank (0–1) when relevance sort is used. */
  rank?: number;
}

export interface FacetBucket {
  value: string;
  count: number;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    collections: FacetBucket[];
    categories: FacetBucket[];
    tags: FacetBucket[];
  };
}

export interface AutocompleteHit {
  productId: string;
  slug: string;
  name: string;
}

export interface SearchService {
  readonly name: string;
  search(query: SearchQuery): Promise<SearchResult>;
  autocomplete(prefix: string, limit?: number): Promise<AutocompleteHit[]>;
  /** Re-index a single product after a write. */
  index(productId: string): Promise<void>;
  /** Remove a product from the index (delete). */
  unindex(productId: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export const SEARCH_SERVICE = Symbol('SEARCH_SERVICE');
