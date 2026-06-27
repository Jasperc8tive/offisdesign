import { z } from 'zod';
import { apiFetch } from '../client';
import {
  pageSchema,
  productSchema,
  collectionSchema,
  collectionDetailSchema,
  categorySchema,
} from '../schemas';

export interface ListProductsParams {
  q?: string;
  collection?: string;
  category?: string;
  tag?: string;
  sort?: 'recent' | 'name' | 'price-asc' | 'price-desc';
  page?: number;
  pageSize?: number;
}

export const catalogService = {
  async listProducts(params: ListProductsParams = {}, signal?: AbortSignal) {
    return apiFetch(pageSchema(productSchema), {
      path: '/v1/storefront/catalog/products',
      query: params as Record<string, string | number | undefined>,
      signal,
    });
  },

  async product(slug: string, signal?: AbortSignal) {
    return apiFetch(productSchema, {
      path: `/v1/storefront/catalog/products/${encodeURIComponent(slug)}`,
      signal,
    });
  },

  async listCollections(params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) {
    return apiFetch(pageSchema(collectionSchema), {
      path: '/v1/storefront/catalog/collections',
      query: params,
      signal,
    });
  },

  async collection(slug: string, signal?: AbortSignal) {
    return apiFetch(collectionDetailSchema, {
      path: `/v1/storefront/catalog/collections/${encodeURIComponent(slug)}`,
      signal,
    });
  },

  async categories(signal?: AbortSignal) {
    return apiFetch(z.array(categorySchema), {
      path: '/v1/storefront/catalog/categories',
      signal,
    });
  },
};
