import { z } from 'zod';
import { apiFetch } from '../client';
import { checkoutSessionSchema, orderSchema, pageSchema, shippingRateSchema } from '../schemas';

export const checkoutService = {
  async start(email: string) {
    return apiFetch(checkoutSessionSchema, {
      method: 'POST',
      path: '/v1/checkout',
      body: { email },
    });
  },

  async setShippingAddress(id: string, address: Record<string, unknown>) {
    return apiFetch(checkoutSessionSchema, {
      method: 'POST',
      path: `/v1/checkout/${encodeURIComponent(id)}/shipping-address`,
      body: address,
    });
  },

  async setBillingAddress(id: string, address: Record<string, unknown>) {
    return apiFetch(checkoutSessionSchema, {
      method: 'POST',
      path: `/v1/checkout/${encodeURIComponent(id)}/billing-address`,
      body: address,
    });
  },

  async shippingRates(id: string) {
    return apiFetch(z.array(shippingRateSchema), {
      path: `/v1/checkout/${encodeURIComponent(id)}/shipping-rates`,
    });
  },

  async setShippingMethod(id: string, method: Record<string, unknown>) {
    return apiFetch(checkoutSessionSchema, {
      method: 'POST',
      path: `/v1/checkout/${encodeURIComponent(id)}/shipping-method`,
      body: method,
    });
  },

  async review(id: string) {
    return apiFetch(
      z.object({
        session: checkoutSessionSchema,
        quote: z.unknown(),
        taxQuote: z.unknown(),
      }),
      {
        method: 'POST',
        path: `/v1/checkout/${encodeURIComponent(id)}/review`,
      },
    );
  },

  async paymentIntent(id: string) {
    return apiFetch(
      z.object({
        provider: z.string(),
        providerRef: z.string(),
        clientSecret: z.string().nullable().optional(),
      }),
      {
        method: 'POST',
        path: `/v1/checkout/${encodeURIComponent(id)}/payment-intent`,
      },
    );
  },

  async place(id: string, idempotencyKey: string, body: { paymentIntentRef?: string } = {}) {
    return apiFetch(orderSchema, {
      method: 'POST',
      path: `/v1/checkout/${encodeURIComponent(id)}/place`,
      body,
      idempotencyKey,
    });
  },

  async orders(params: { page?: number; pageSize?: number } = {}) {
    return apiFetch(pageSchema(orderSchema), {
      path: '/v1/checkout/orders',
      query: params,
    });
  },

  async order(id: string) {
    return apiFetch(orderSchema, {
      path: `/v1/checkout/orders/${encodeURIComponent(id)}`,
    });
  },
};
