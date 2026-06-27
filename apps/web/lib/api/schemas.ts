import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────
// Pagination envelope (matches `buildPage` in the API)
// ────────────────────────────────────────────────────────────────────────

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

// ────────────────────────────────────────────────────────────────────────
// Auth / customer
// ────────────────────────────────────────────────────────────────────────

export const principalSchema = z.object({
  id: z.string(),
  kind: z.enum(['admin', 'customer']),
});

export const customerSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  emailVerifiedAt: z.string().nullable(),
  marketingOptIn: z.boolean(),
  createdAt: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const addressSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  region: z.string().nullable(),
  postcode: z.string(),
  countryCode: z.string(),
  phone: z.string().nullable(),
  isDefault: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;

// ────────────────────────────────────────────────────────────────────────
// Catalog
// ────────────────────────────────────────────────────────────────────────

export const variantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string().nullable(),
  priceAmount: z.number().int(),
  priceCurrency: z.string(),
  compareAtAmount: z.number().int().nullable(),
  options: z
    .array(
      z.object({
        optionValueId: z.string(),
        optionValue: z.object({
          id: z.string(),
          value: z.string(),
          label: z.string(),
        }),
      }),
    )
    .optional()
    .default([]),
});
export type Variant = z.infer<typeof variantSchema>;

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  brand: z.string().nullable(),
  version: z.number().int(),
  publishedAt: z.string().nullable(),
  variants: z.array(variantSchema),
  options: z
    .array(
      z.object({
        id: z.string(),
        key: z.string(),
        name: z.string(),
        values: z.array(
          z.object({
            id: z.string(),
            value: z.string(),
            label: z.string(),
            position: z.number().int(),
          }),
        ),
      }),
    )
    .default([]),
  media: z
    .array(
      z.object({
        id: z.string(),
        mediaId: z.string(),
        alt: z.string().nullable(),
        position: z.number().int(),
      }),
    )
    .default([]),
  collections: z
    .array(
      z.object({
        collectionId: z.string(),
        collection: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
      }),
    )
    .default([]),
  tags: z
    .array(z.object({ tag: z.object({ id: z.string(), slug: z.string(), name: z.string() }) }))
    .default([]),
  linksFrom: z
    .array(
      z.object({
        id: z.string(),
        toProductId: z.string(),
        kind: z.enum(['RELATED', 'CROSS_SELL', 'UP_SELL']),
        position: z.number().int(),
        to: z.object({
          id: z.string(),
          slug: z.string(),
          name: z.string(),
          variants: z
            .array(
              z.object({
                id: z.string(),
                priceAmount: z.number().int(),
                priceCurrency: z.string(),
                compareAtAmount: z.number().int().nullable().optional(),
              }),
            )
            .default([]),
        }),
      }),
    )
    .default([]),
});
export type Product = z.infer<typeof productSchema>;

export const collectionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isVisible: z.boolean(),
  position: z.number().int(),
});
export type Collection = z.infer<typeof collectionSchema>;

export const collectionDetailSchema = collectionSchema.extend({
  products: z
    .array(
      z.object({
        position: z.number().int(),
        product: productSchema.partial({ variants: true, options: true, media: true }),
      }),
    )
    .default([]),
});

export const categorySchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  slug: z.string(),
  name: z.string(),
  position: z.number().int(),
});
export type Category = z.infer<typeof categorySchema>;

// ────────────────────────────────────────────────────────────────────────
// Search
// ────────────────────────────────────────────────────────────────────────

export const searchHitSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  fromAmount: z.number().int().nullable(),
  currency: z.string(),
  collectionSlugs: z.array(z.string()),
  categorySlugs: z.array(z.string()),
  tagSlugs: z.array(z.string()),
});
export type SearchHit = z.infer<typeof searchHitSchema>;

export const facetBucketSchema = z.object({ value: z.string(), count: z.number().int() });
export const searchResultSchema = z.object({
  hits: z.array(searchHitSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  facets: z.object({
    collections: z.array(facetBucketSchema),
    categories: z.array(facetBucketSchema),
    tags: z.array(facetBucketSchema),
  }),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const autocompleteHitSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
});

// ────────────────────────────────────────────────────────────────────────
// Cart
// ────────────────────────────────────────────────────────────────────────

export const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  variantId: z.string(),
  quantity: z.number().int(),
  unitAmount: z.number().int(),
  currency: z.string(),
});

export const cartViewSchema = z.object({
  cart: z.object({
    id: z.string(),
    customerId: z.string().nullable(),
    anonymousId: z.string().nullable(),
    email: z.string().nullable(),
    currency: z.string(),
    status: z.enum(['ACTIVE', 'CHECKED_OUT', 'ABANDONED']),
    appliedCoupon: z.string().nullable(),
    version: z.number().int(),
    items: z.array(cartItemSchema),
  }),
  subtotal: z.number().int(),
  discount: z.number().int(),
  total: z.number().int(),
  appliedDiscountIds: z.array(z.string()),
});
export type CartView = z.infer<typeof cartViewSchema>;

// ────────────────────────────────────────────────────────────────────────
// Checkout / orders
// ────────────────────────────────────────────────────────────────────────

export const shippingRateSchema = z.object({
  id: z.string(),
  carrier: z.string(),
  service: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  estimatedDaysMin: z.number().int(),
  estimatedDaysMax: z.number().int(),
});
export type ShippingRate = z.infer<typeof shippingRateSchema>;

export const checkoutSessionSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  customerId: z.string().nullable(),
  email: z.string(),
  currency: z.string(),
  shippingAddress: z.unknown().nullable(),
  billingAddress: z.unknown().nullable(),
  shippingMethod: z.unknown().nullable(),
  subtotalAmount: z.number().int(),
  shippingAmount: z.number().int(),
  taxAmount: z.number().int(),
  discountAmount: z.number().int(),
  totalAmount: z.number().int(),
  status: z.enum(['PENDING', 'AWAITING_PAYMENT', 'COMPLETED', 'EXPIRED', 'CANCELLED']),
  paymentProvider: z.string().nullable(),
  paymentIntentRef: z.string().nullable(),
  expiresAt: z.string(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  email: z.string(),
  currency: z.string(),
  subtotalAmount: z.number().int(),
  shippingAmount: z.number().int(),
  taxAmount: z.number().int(),
  discountAmount: z.number().int(),
  totalAmount: z.number().int(),
  status: z.string(),
  placedAt: z.string().nullable(),
  items: z
    .array(
      z.object({
        id: z.string(),
        variantId: z.string(),
        productName: z.string(),
        sku: z.string(),
        quantity: z.number().int(),
        unitAmount: z.number().int(),
        totalAmount: z.number().int(),
        currency: z.string(),
      }),
    )
    .default([]),
});
export type Order = z.infer<typeof orderSchema>;

// ────────────────────────────────────────────────────────────────────────
// CMS
// ────────────────────────────────────────────────────────────────────────

export const cmsPageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  kind: z.enum(['STANDARD', 'LANDING']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),
  seo: z.unknown().nullable(),
  publishedAt: z.string().nullable(),
  blocks: z
    .array(
      z.object({
        id: z.string(),
        kind: z.string(),
        position: z.number().int(),
        payload: z.unknown(),
      }),
    )
    .default([]),
});

export const blogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  body: z.string(),
  coverMediaId: z.string().nullable(),
  status: z.string(),
  publishedAt: z.string().nullable(),
  tags: z.array(z.string()),
  author: z.object({ id: z.string(), name: z.string(), bio: z.string().nullable() }).nullable(),
});

export const navigationSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  items: z.unknown(),
});

export const announcementSchema = z.object({
  id: z.string(),
  message: z.string(),
  href: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
});

export const testimonialSchema = z.object({
  id: z.string(),
  author: z.string(),
  quote: z.string(),
  source: z.string().nullable(),
  imageId: z.string().nullable(),
  isVisible: z.boolean(),
});

export const faqSchema = z.object({
  id: z.string(),
  category: z.string().nullable(),
  question: z.string(),
  answer: z.string(),
  position: z.number().int(),
  isVisible: z.boolean(),
});
