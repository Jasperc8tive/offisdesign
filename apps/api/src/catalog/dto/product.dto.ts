import { z } from 'zod';

const productStatus = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(10_000).optional(),
  brand: z.string().max(100).optional(),
  status: productStatus.default('DRAFT'),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(10_000).nullish(),
  brand: z.string().max(100).nullish(),
  status: productStatus.optional(),
  /** Required for optimistic concurrency. */
  version: z.number().int().min(0),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  status: productStatus.optional(),
  collection: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['recent', 'name', 'price-asc', 'price-desc']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  includeDeleted: z.coerce.boolean().default(false),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().max(200).optional(),
  barcode: z.string().max(64).optional(),
  priceAmount: z.number().int().min(0),
  priceCurrency: z.string().length(3).default('GBP'),
  compareAtAmount: z.number().int().min(0).optional(),
  weightGrams: z.number().int().min(0).optional(),
  isDefault: z.boolean().default(false),
  optionValueIds: z.array(z.string().uuid()).default([]),
});
export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = createVariantSchema.partial().extend({
  optionValueIds: z.array(z.string().uuid()).optional(),
});
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const linkProductsSchema = z.object({
  toProductId: z.string().uuid(),
  kind: z.enum(['RELATED', 'CROSS_SELL', 'UP_SELL']),
  position: z.number().int().min(0).default(0),
});
export type LinkProductsInput = z.infer<typeof linkProductsSchema>;
