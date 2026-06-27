import { PromotionEngineService } from './promotion-engine.service';
import type { Discount } from '@offisdesign/database';
import type { QuoteRequest } from './dto/pricing.dto';

const engine = new PromotionEngineService();

function disc(partial: Partial<Discount>): Discount {
  return {
    id: 'disc-1',
    code: null,
    name: 'test',
    kind: 'PERCENT',
    value: 1000,
    currency: null,
    scope: 'CART',
    targetIds: [],
    minSubtotal: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...partial,
  } as unknown as Discount;
}

const baseRequest: QuoteRequest = {
  currency: 'GBP',
  couponCodes: [],
  lines: [
    {
      variantId: 'v1',
      productId: 'p1',
      collectionIds: ['c1'],
      unitAmount: 10_000, // £100.00
      quantity: 2,
    },
  ],
};

describe('PromotionEngineService', () => {
  it('returns subtotal when no discounts apply', () => {
    const q = engine.apply(baseRequest, { active: [], byCode: [] });
    expect(q.subtotal).toBe(20_000);
    expect(q.discount).toBe(0);
    expect(q.total).toBe(20_000);
  });

  it('applies a 10% cart-scoped percent discount', () => {
    const q = engine.apply(baseRequest, {
      active: [disc({ id: 'd1', kind: 'PERCENT', value: 1000, scope: 'CART' })],
      byCode: [],
    });
    expect(q.discount).toBe(2_000);
    expect(q.total).toBe(18_000);
    expect(q.appliedDiscountIds).toContain('d1');
  });

  it('applies fixed currency discount only on matching currency', () => {
    const q = engine.apply(baseRequest, {
      active: [disc({ id: 'd1', kind: 'FIXED', value: 500, currency: 'USD', scope: 'CART' })],
      byCode: [],
    });
    expect(q.discount).toBe(0);
  });

  it('respects minSubtotal threshold', () => {
    const q = engine.apply(baseRequest, {
      active: [
        disc({ id: 'd1', kind: 'PERCENT', value: 1000, minSubtotal: 30_000, scope: 'CART' }),
      ],
      byCode: [],
    });
    expect(q.discount).toBe(0);
  });

  it('applies a PRODUCT-scoped discount only to matching product', () => {
    const q = engine.apply(baseRequest, {
      active: [
        disc({
          id: 'd1',
          scope: 'PRODUCT',
          targetIds: ['p1'],
          kind: 'PERCENT',
          value: 5000,
        }),
        disc({
          id: 'd2',
          scope: 'PRODUCT',
          targetIds: ['p-other'],
          kind: 'PERCENT',
          value: 5000,
        }),
      ],
      byCode: [],
    });
    expect(q.lines[0]?.lineDiscount).toBe(10_000);
    expect(q.discount).toBe(10_000);
    expect(q.appliedDiscountIds).toEqual(['d1']);
  });

  it('caps fixed discount at line total', () => {
    const q = engine.apply(baseRequest, {
      active: [
        disc({
          id: 'd1',
          scope: 'CART',
          kind: 'FIXED',
          value: 999_999,
          currency: 'GBP',
        }),
      ],
      byCode: [],
    });
    expect(q.total).toBe(0);
  });
});
