import { z } from 'zod';
import { apiFetch, apiRequest } from '../client';

const wishlistItemSchema = z.object({
  productId: z.string(),
  addedAt: z.string(),
  product: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      variants: z
        .array(
          z.object({
            id: z.string(),
            priceAmount: z.number().int(),
            priceCurrency: z.string(),
          }),
        )
        .default([]),
    })
    .nullable(),
});

export const wishlistService = {
  list() {
    return apiFetch(z.array(wishlistItemSchema), {
      path: '/v1/customer/wishlist',
    });
  },

  add(productId: string) {
    return apiFetch(z.object({ added: z.boolean() }), {
      method: 'POST',
      path: `/v1/customer/wishlist/${encodeURIComponent(productId)}`,
    });
  },

  remove(productId: string) {
    return apiFetch(z.object({ removed: z.boolean() }), {
      method: 'DELETE',
      path: `/v1/customer/wishlist/${encodeURIComponent(productId)}`,
    });
  },

  merge(productIds: string[]) {
    return apiFetch(z.array(wishlistItemSchema), {
      method: 'POST',
      path: '/v1/customer/wishlist/merge',
      body: { productIds },
    });
  },

  async ping() {
    await apiRequest({ path: '/v1/customer/wishlist' });
  },
};
