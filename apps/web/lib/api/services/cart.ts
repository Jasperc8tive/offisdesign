import { apiFetch, apiRequest } from '../client';
import { cartViewSchema } from '../schemas';

export const cartService = {
  async get(signal?: AbortSignal) {
    return apiFetch(cartViewSchema, { path: '/v1/cart', signal });
  },

  async addItem(variantId: string, quantity = 1) {
    return apiFetch(cartViewSchema, {
      method: 'POST',
      path: '/v1/cart/items',
      body: { variantId, quantity },
    });
  },

  async updateItem(variantId: string, quantity: number) {
    return apiFetch(cartViewSchema, {
      method: 'PATCH',
      path: `/v1/cart/items/${encodeURIComponent(variantId)}`,
      body: { quantity },
    });
  },

  async removeItem(variantId: string) {
    return apiFetch(cartViewSchema, {
      method: 'DELETE',
      path: `/v1/cart/items/${encodeURIComponent(variantId)}`,
    });
  },

  async clear() {
    return apiFetch(cartViewSchema, { method: 'DELETE', path: '/v1/cart' });
  },

  async applyCoupon(code: string | null) {
    return apiFetch(cartViewSchema, {
      method: 'POST',
      path: '/v1/cart/coupon',
      body: { code },
    });
  },

  async merge() {
    await apiRequest({ method: 'POST', path: '/v1/cart/merge' });
  },
};
