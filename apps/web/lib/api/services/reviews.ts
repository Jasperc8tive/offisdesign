import { z } from 'zod';
import { apiFetch } from '../client';

export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  customerId: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable(),
  body: z.string(),
  verifiedPurchase: z.boolean(),
  status: z.string(),
  helpfulCount: z.number().int(),
  createdAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;

const reviewListSchema = z.object({
  data: z.array(reviewSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const reviewSummarySchema = z.object({
  count: z.number().int(),
  average: z.number(),
  buckets: z.record(z.string(), z.number().int()),
});
export type ReviewSummary = z.infer<typeof reviewSummarySchema>;

export const reviewsService = {
  list(productId: string, params: { page?: number; pageSize?: number } = {}, signal?: AbortSignal) {
    return apiFetch(reviewListSchema, {
      path: `/v1/storefront/reviews/products/${encodeURIComponent(productId)}`,
      query: params,
      signal,
    });
  },

  summary(productId: string, signal?: AbortSignal) {
    return apiFetch(reviewSummarySchema, {
      path: `/v1/storefront/reviews/products/${encodeURIComponent(productId)}/summary`,
      signal,
    });
  },

  submit(input: { productId: string; rating: number; title?: string; body: string }) {
    return apiFetch(reviewSchema, {
      method: 'POST',
      path: '/v1/storefront/reviews',
      body: input,
    });
  },

  vote(reviewId: string) {
    return apiFetch(z.object({ voted: z.boolean() }), {
      method: 'POST',
      path: `/v1/storefront/reviews/${encodeURIComponent(reviewId)}/helpful`,
    });
  },
};
