'use client';

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

export function useCategories(): ReturnType<typeof useQuery<Category[]>> {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: ({ signal }) => catalogService.categories(signal),
    staleTime: 5 * 60_000,
  });
}

export type { Product, Collection, Category };
