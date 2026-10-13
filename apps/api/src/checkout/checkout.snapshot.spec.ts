import {
  buildSnapshot,
  cartFingerprint,
  readSnapshot,
  type SnapshotCart,
} from './checkout.snapshot';

const cart = (over: Partial<SnapshotCart> = {}): SnapshotCart => ({
  currency: 'NGN',
  appliedCoupon: null,
  items: [
    { variantId: 'v1', quantity: 2, unitAmount: 50_000, currency: 'NGN' },
    { variantId: 'v2', quantity: 1, unitAmount: 120_000, currency: 'NGN' },
  ],
  ...over,
});

describe('cartFingerprint', () => {
  it('ignores line order', () => {
    const a = cart();
    const b = cart({ items: [...a.items].reverse() });
    expect(cartFingerprint(a)).toBe(cartFingerprint(b));
  });

  it.each([
    [
      'quantity',
      { items: [{ variantId: 'v1', quantity: 3, unitAmount: 50_000, currency: 'NGN' }] },
    ],
    ['unit price', { items: [{ variantId: 'v1', quantity: 2, unitAmount: 1, currency: 'NGN' }] }],
    ['coupon', { appliedCoupon: 'WELCOME10' }],
    ['currency', { currency: 'USD' }],
  ] as [string, Partial<SnapshotCart>][])('changes when the %s changes', (_label, over) => {
    const base = cart({
      items: [{ variantId: 'v1', quantity: 2, unitAmount: 50_000, currency: 'NGN' }],
    });
    expect(cartFingerprint({ ...base, ...over })).not.toBe(cartFingerprint(base));
  });
});

describe('buildSnapshot', () => {
  it('captures names and sku from the variant lookup', () => {
    const snap = buildSnapshot(cart(), [
      { id: 'v1', sku: 'CHR-01', name: 'Black', product: { name: 'Task chair' } },
    ]);
    expect(snap.fingerprint).toBe(cartFingerprint(cart()));
    expect(snap.lines[0]).toMatchObject({
      productName: 'Task chair',
      variantName: 'Black',
      sku: 'CHR-01',
    });
    expect(snap.lines[1]).toMatchObject({ productName: 'Unknown product', sku: 'UNKNOWN' });
    expect(readSnapshot(JSON.parse(JSON.stringify(snap)))).toEqual(snap);
  });

  it('readSnapshot rejects non-snapshots', () => {
    expect(readSnapshot(null)).toBeNull();
    expect(readSnapshot({ lines: [] })).toBeNull();
  });
});
