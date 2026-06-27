import { z } from 'zod';
import { apiFetch } from '../client';

const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  since: z.string().optional(),
});

const settingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  isPublic: z.boolean(),
});

export const opsService = {
  async maintenance(signal?: AbortSignal) {
    return apiFetch(maintenanceSchema, {
      path: '/v1/storefront/ops/maintenance',
      signal,
    });
  },

  async publicSettings(signal?: AbortSignal) {
    return apiFetch(z.array(settingSchema), {
      path: '/v1/storefront/ops/settings',
      signal,
    });
  },
};
