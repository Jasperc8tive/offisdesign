import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Mirror of the schema declared inline in wishlist.ts so we can exercise
// nullable product hydration without needing to export it.
const item = z.object({
  productId: z.string(),
  addedAt: z.string(),
  product: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      variants: z
        .array(
          z.object({
            id: z.string(),
            priceAmount: z.number().int(),
            priceCurrency: z.string(),
          }),
        )
        .default([]),
    })
    .nullable(),
});

describe('wishlist item schema', () => {
  it('accepts a row with a null product (deleted/hidden)', () => {
    const out = item.parse({ productId: 'p1', addedAt: '2026-01-01', product: null });
    expect(out.product).toBeNull();
  });

  it('hydrates variants array when product is present', () => {
    const out = item.parse({
      productId: 'p1',
      addedAt: '2026-01-01',
      product: { id: 'p1', slug: 's', name: 'n' },
    });
    expect(out.product?.variants).toEqual([]);
  });
});
