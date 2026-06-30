'use client';

import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { catalogService, type ListProductsParams } from '../api/services/catalog';
import type { Product, Collection, Category } from '../api/schemas';

export const catalogKeys = {
  products: (params: ListProductsParams) => ['catalog', 'products', params] as const,
  product: (slug: string) => ['catalog', 'product', slug] as const,
  collections: (params: { page?: number; pageSize?: number }) =>
    ['catalog', 'collections', params] as const,
  collection: (slug: string) => ['catalog', 'collection', slug] as const,
  categories: () => ['catalog', 'categories'] as const,
};

export function useProducts(
  params: ListProductsParams = {},
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof catalogService.listProducts>>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: ({ signal }) => catalogService.listProducts(params, signal),
    ...options,
  });
}

export function useProduct(
  slug: string | undefined,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery({
    queryKey: catalogKeys.product(slug ?? ''),
    queryFn: ({ signal }) => catalogService.product(slug!, signal),
    enabled: !!slug,
    ...options,
  });
}

export function useCollections(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: catalogKeys.collections(params),
    queryFn: ({ signal }) => catalogService.listCollections(params, signal),
  });
}

export function useCollection(slug: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.collection(slug ?? ''),
    queryFn: ({ signal }) => catalogService.collection(slug!, signal),
    enabled: !!slug,
  });
}

export interface VariantRef {
  productId: string;
  name: string;
  slug: string;
  mediaId?: string | null;
}

/**
 * Builds a `variantId → product` index by reading the storefront catalog.
 *
 * The cart/checkout line items only carry a `variantId` (the API doesn't
 * denormalise product names onto cart lines the way it does for orders), so the
 * client joins them back to product names + slugs here. Gated by `enabled` so we
 * only pay for the catalog fetch when something actually needs it (e.g. the cart
 * drawer is open). Capped at 100 products — sufficient for this catalogue; a
 * larger store would want a dedicated `resolve-variants` endpoint instead.
 */
export function useVariantIndex(options?: { enabled?: boolean }) {
  const query = useProducts(
    { pageSize: 100 },
    { staleTime: 5 * 60_000, enabled: options?.enabled ?? true },
  );
  const index = useMemo(() => {
    const map = new Map<string, VariantRef>();
    for (const p of query.data?.data ?? []) {
      const mediaId = p.media[0]?.mediaId ?? null;
      for (const v of p.variants ?? []) {
        map.set(v.id, { productId: p.id, name: p.name, slug: p.slug, mediaId });
      }
    }
    return map;
  }, [query.data]);
  return { index, isLoading: query.isLoading };
}

export function useCategories(): ReturnType<typeof useQuery<Category[]>> {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: ({ signal }) => catalogService.categories(signal),
    staleTime: 5 * 60_000,
  });
}

export type { Product, Collection, Category };
