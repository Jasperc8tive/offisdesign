import { z } from 'zod';

/** Plain object — used as a base for `partial()` in PATCH. */
export const discountObject = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(64).optional(),
  kind: z.enum(['PERCENT', 'FIXED']),
  /** PERCENT: 0–10000 (0.00–100.00%). FIXED: minor units. */
  value: z.number().int().min(0),
  currency: z.string().length(3).optional(),
  scope: z.enum(['CART', 'PRODUCT', 'COLLECTION']).default('CART'),
  targetIds: z.array(z.string().uuid()).default([]),
  minSubtotal: z.number().int().min(0).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export const discountInputSchema = discountObject
  .refine((v) => v.kind !== 'PERCENT' || v.value <= 10_000, {
    message: 'Percent value must be 0–10000 (basis points)',
    path: ['value'],
  })
  .refine((v) => v.kind !== 'FIXED' || v.currency !== undefined, {
    message: 'Fixed discounts require currency',
    path: ['currency'],
  });
export type DiscountInput = z.infer<typeof discountInputSchema>;
export const discountPatchSchema = discountObject.partial();
export type DiscountPatch = z.infer<typeof discountPatchSchema>;

export const quoteRequestSchema = z.object({
  currency: z.string().length(3).default('GBP'),
  lines: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        productId: z.string().uuid(),
        collectionIds: z.array(z.string().uuid()).default([]),
        unitAmount: z.number().int().min(0),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  couponCodes: z.array(z.string()).default([]),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export interface QuoteLine {
  variantId: string;
  unitAmount: number;
  quantity: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  total: number;
  appliedDiscountIds: string[];
}
