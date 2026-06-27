import { z } from 'zod';

export const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const applyCouponSchema = z.object({ code: z.string().min(1).max(64).nullable() });
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
