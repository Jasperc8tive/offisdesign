import { z } from 'zod';
import { apiFetch } from '../client';
import { searchResultSchema, autocompleteHitSchema } from '../schemas';

export interface SearchParams {
  q?: string | undefined;
  collection?: string[] | undefined;
  category?: string[] | undefined;
  tag?: string[] | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  sort?: 'relevance' | 'recent' | 'price-asc' | 'price-desc' | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export const searchService = {
  async query(params: SearchParams, signal?: AbortSignal) {
    return apiFetch(searchResultSchema, {
      path: '/v1/storefront/search',
      query: params as Record<string, string | number | string[] | undefined>,
      signal,
    });
  },

  async autocomplete(q: string, limit = 8, signal?: AbortSignal) {
    return apiFetch(z.array(autocompleteHitSchema), {
      path: '/v1/storefront/search/autocomplete',
      query: { q, limit },
      signal,
    });
  },
};
