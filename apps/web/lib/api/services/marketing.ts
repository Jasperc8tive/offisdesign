import { z } from 'zod';
import { apiFetch, apiRequest } from '../client';

const subscribeResponse = z.object({
  subscribed: z.boolean(),
  resubscribed: z.boolean(),
  id: z.string(),
});

export const marketingService = {
  async subscribe(input: { email: string; source?: string; referrer?: string }) {
    return apiFetch(subscribeResponse, {
      method: 'POST',
      path: '/v1/storefront/marketing/newsletter',
      body: input,
    });
  },

  async unsubscribe(email: string) {
    await apiRequest({
      method: 'POST',
      path: '/v1/storefront/marketing/newsletter/unsubscribe',
      body: { email },
    });
  },
};
