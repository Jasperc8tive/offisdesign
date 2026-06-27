import { z } from 'zod';
import { apiFetch } from '../client';

export const availabilitySchema = z.object({
  variantId: z.string(),
  available: z.number().int(),
  state: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
});
export type Availability = z.infer<typeof availabilitySchema>;

export const inventoryService = {
  availability(variantIds: string[], signal?: AbortSignal) {
    return apiFetch(z.array(availabilitySchema), {
      method: 'POST',
      path: '/v1/storefront/inventory/availability',
      body: { variantIds },
      signal,
    });
  },
};
