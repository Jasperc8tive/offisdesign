'use client';

import { useQuery } from '@tanstack/react-query';
import { searchService, type SearchParams } from '../api/services/search';

export const searchKeys = {
  results: (params: SearchParams) => ['search', 'results', params] as const,
  autocomplete: (q: string, limit: number) => ['search', 'autocomplete', q, limit] as const,
};

export function useSearch(params: SearchParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: ({ signal }) => searchService.query(params, signal),
    placeholderData: (prev) => prev,
    enabled: options.enabled ?? true,
  });
}

export function useAutocomplete(q: string, limit = 8) {
  return useQuery({
    queryKey: searchKeys.autocomplete(q, limit),
    queryFn: ({ signal }) => searchService.autocomplete(q, limit, signal),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });
}
