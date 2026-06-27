import { z } from 'zod';

export const warehouseInputSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  countryCode: z.string().length(2),
  isActive: z.boolean().default(true),
});
export type WarehouseInput = z.infer<typeof warehouseInputSchema>;

export const adjustStockSchema = z.object({
  variantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  delta: z.number().int(),
  reason: z.enum(['PURCHASE', 'SALE', 'RETURN', 'COUNT', 'DAMAGE', 'TRANSFER']),
  reference: z.string().max(200).optional(),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

export const reserveStockSchema = z.object({
  variantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
  contextType: z.string().min(1).max(64),
  contextId: z.string().uuid(),
  /** Reservation TTL in seconds. Defaults to 15 minutes. */
  ttlSec: z
    .number()
    .int()
    .positive()
    .default(15 * 60),
});
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
