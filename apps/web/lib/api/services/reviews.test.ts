import { describe, expect, it } from 'vitest';
import { reviewSchema, reviewSummarySchema } from './reviews';

describe('review schemas', () => {
  it('parses a published review row', () => {
    const out = reviewSchema.parse({
      id: 'r1',
      productId: 'p1',
      customerId: 'c1',
      rating: 5,
      title: 'Loved it',
      body: 'A great chair.',
      verifiedPurchase: true,
      status: 'PUBLISHED',
      helpfulCount: 3,
      createdAt: '2026-01-01T00:00:00Z',
    });
    expect(out.rating).toBe(5);
    expect(out.verifiedPurchase).toBe(true);
  });

  it('rejects ratings outside 1–5', () => {
    expect(() =>
      reviewSchema.parse({
        id: 'r1',
        productId: 'p1',
        customerId: null,
        rating: 6,
        title: null,
        body: 'bad',
        verifiedPurchase: false,
        status: 'PUBLISHED',
        helpfulCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    ).toThrow();
  });

  it('parses a summary with sparse buckets', () => {
    const out = reviewSummarySchema.parse({
      count: 4,
      average: 4.25,
      buckets: { '5': 2, '4': 1, '3': 1 },
    });
    expect(out.buckets['5']).toBe(2);
    expect(out.buckets['1']).toBeUndefined();
  });
});
