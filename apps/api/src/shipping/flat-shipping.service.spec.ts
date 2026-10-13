import type { ApiEnv } from '@offisdesign/config';
import { FlatShippingService } from './flat-shipping.service';

const request = (subtotal: number) => ({
  currency: 'NGN',
  subtotal,
  destination: { countryCode: 'NG', postcode: '100001' },
  lines: [],
});

const svc = (env: Partial<ApiEnv>) =>
  new FlatShippingService({
    SHIPPING_FLAT_AMOUNT: 0,
    SHIPPING_EXPRESS_SURCHARGE: 0,
    ...env,
  } as ApiEnv);

describe('FlatShippingService', () => {
  it('offers only standard when no express surcharge is configured', async () => {
    const rates = await svc({ SHIPPING_FLAT_AMOUNT: 1_500_000 }).rates(request(10_000_000));
    expect(rates.map((r) => [r.id, r.amount])).toEqual([['standard', 1_500_000]]);
  });

  it('is never free when no threshold is set', async () => {
    const [standard] = await svc({ SHIPPING_FLAT_AMOUNT: 1_500_000 }).rates(request(10 ** 9));
    expect(standard!.amount).toBe(1_500_000);
  });

  it('makes standard free at or above the threshold', async () => {
    const s = svc({ SHIPPING_FLAT_AMOUNT: 1_500_000, SHIPPING_FREE_THRESHOLD: 100_000_000 });
    expect((await s.rates(request(99_999_999)))[0]!.amount).toBe(1_500_000);
    expect((await s.rates(request(100_000_000)))[0]!.amount).toBe(0);
  });

  it('prices express as standard plus the surcharge', async () => {
    const rates = await svc({
      SHIPPING_FLAT_AMOUNT: 1_500_000,
      SHIPPING_EXPRESS_SURCHARGE: 2_500_000,
    }).rates(request(0));
    expect(rates.find((r) => r.id === 'express')!.amount).toBe(4_000_000);
  });
});
