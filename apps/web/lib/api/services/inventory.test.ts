import { describe, expect, it } from 'vitest';
import { availabilitySchema } from './inventory';

describe('inventory availability schema', () => {
  it.each([
    ['out_of_stock' as const, 0],
    ['low_stock' as const, 3],
    ['in_stock' as const, 99],
  ])('parses %s', (state, available) => {
    const out = availabilitySchema.parse({ variantId: 'v', available, state });
    expect(out.state).toBe(state);
  });

  it('rejects unknown states', () => {
    expect(() =>
      availabilitySchema.parse({ variantId: 'v', available: 1, state: 'maybe' }),
    ).toThrow();
  });
});
