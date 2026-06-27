import { z } from 'zod';

export const principalSchema = z.object({
  id: z.string(),
  kind: z.enum(['admin', 'customer']),
  sessionId: z.string().optional(),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
});
export type Principal = z.infer<typeof principalSchema>;

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

// ── Catalog ──────────────────────────────────────────────────────────────

export const adminProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  brand: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        sku: z.string(),
        priceAmount: z.number().int(),
        priceCurrency: z.string(),
      }),
    )
    .default([]),
});
export type AdminProduct = z.infer<typeof adminProductSchema>;

// ── Orders ───────────────────────────────────────────────────────────────

export const adminOrderSchema = z.object({
  id: z.string(),
  number: z.string(),
  email: z.string(),
  currency: z.string(),
  subtotalAmount: z.number().int(),
  totalAmount: z.number().int(),
  status: z.string(),
  placedAt: z.string().nullable().optional(),
});
export type AdminOrder = z.infer<typeof adminOrderSchema>;

// ── Customers ────────────────────────────────────────────────────────────

export const adminCustomerSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  emailVerifiedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AdminCustomer = z.infer<typeof adminCustomerSchema>;

// ── CMS ──────────────────────────────────────────────────────────────────

export const cmsPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  kind: z.enum(['STANDARD', 'LANDING']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),
  publishedAt: z.string().nullable().optional(),
});
export type CmsPage = z.infer<typeof cmsPageSchema>;

// ── Ops ──────────────────────────────────────────────────────────────────

export const featureFlagSchema = z.object({
  id: z.string(),
  key: z.string(),
  description: z.string().nullable().optional(),
  enabled: z.boolean(),
  rollout: z.number().int().nullable().optional(),
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;

export const auditEntrySchema = z.object({
  id: z.string(),
  actorId: z.string().nullable().optional(),
  actorKind: z.string().nullable().optional(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const queueHealthSchema = z.object({
  queues: z
    .array(
      z.object({
        name: z.string(),
        waiting: z.number().int(),
        active: z.number().int(),
        failed: z.number().int(),
        completed: z.number().int().optional(),
      }),
    )
    .default([]),
});
export type QueueHealth = z.infer<typeof queueHealthSchema>;

// ── Inventory ────────────────────────────────────────────────────────────

export const lowStockRowSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  productName: z.string(),
  onHand: z.number().int(),
  reserved: z.number().int(),
});
export type LowStockRow = z.infer<typeof lowStockRowSchema>;
