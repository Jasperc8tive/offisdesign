import { describe, expect, it } from 'vitest';
import { cartViewSchema, pageSchema, productSchema } from './schemas';

describe('schemas', () => {
  it('parses a product with the minimum required shape', () => {
    const out = productSchema.parse({
      id: 'p1',
      slug: 's',
      name: 'n',
      description: null,
      status: 'ACTIVE',
      brand: null,
      version: 0,
      publishedAt: null,
      variants: [],
    });
    expect(out.options).toEqual([]);
    expect(out.media).toEqual([]);
  });

  it('parses a paginated envelope', () => {
    const out = pageSchema(productSchema).parse({
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    });
    expect(out.data).toEqual([]);
  });

  it('rejects an invalid cart view', () => {
    expect(() => cartViewSchema.parse({ cart: { id: 1 } })).toThrow();
  });
});
