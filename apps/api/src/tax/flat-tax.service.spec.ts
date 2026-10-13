import type { ApiEnv } from '@offisdesign/config';
import { FlatTaxService } from './flat-tax.service';

const svc = new FlatTaxService({ TAX_FLAT_RATE_BPS: 750 } as ApiEnv);

const line = (variantId: string, unitAmount: number, quantity: number) => ({
  variantId,
  productId: variantId,
  unitAmount,
  quantity,
  countryCode: 'NG',
});

describe('FlatTaxService', () => {
  it('taxes goods at 7.5% plus shipping', async () => {
    const q = await svc.calculate({
      currency: 'NGN',
      destinationCountry: 'NG',
      shippingAmount: 1_000_000, // ₦10,000
      lines: [line('a', 10_000_000, 2)], // 2 × ₦100,000
    });
    expect(q.lines[0]!.taxAmount).toBe(1_500_000);
    expect(q.shippingTaxAmount).toBe(75_000);
    expect(q.totalTax).toBe(1_575_000);
  });

  it('taxes goods after the order discount', async () => {
    const q = await svc.calculate({
      currency: 'NGN',
      destinationCountry: 'NG',
      shippingAmount: 0,
      discountAmount: 5_000_000,
      lines: [line('a', 10_000_000, 1), line('b', 10_000_000, 1)],
    });
    expect(q.lines.map((l) => l.taxableAmount)).toEqual([7_500_000, 7_500_000]);
    expect(q.totalTax).toBe(1_125_000); // 7.5% of ₦150,000
  });

  it('line taxes always sum to the goods tax', async () => {
    const q = await svc.calculate({
      currency: 'NGN',
      destinationCountry: 'NG',
      shippingAmount: 0,
      discountAmount: 333,
      lines: [line('a', 999, 3), line('b', 1_001, 7), line('c', 17, 1)],
    });
    const lineSum = q.lines.reduce((acc, l) => acc + l.taxAmount, 0);
    expect(lineSum).toBe(q.totalTax);
    expect(q.lines.reduce((acc, l) => acc + l.taxableAmount, 0)).toBe(
      999 * 3 + 1_001 * 7 + 17 - 333,
    );
  });

  it('never taxes a negative amount when the discount exceeds the goods', async () => {
    const q = await svc.calculate({
      currency: 'NGN',
      destinationCountry: 'NG',
      shippingAmount: 0,
      discountAmount: 50_000,
      lines: [line('a', 10_000, 1)],
    });
    expect(q.totalTax).toBe(0);
  });

  it('stays exact on large B2B orders', async () => {
    const q = await svc.calculate({
      currency: 'NGN',
      destinationCountry: 'NG',
      shippingAmount: 0,
      discountAmount: 1,
      lines: [line('a', 2_000_000_000, 1), line('b', 1, 1)],
    });
    expect(q.lines.reduce((acc, l) => acc + l.taxAmount, 0)).toBe(q.totalTax);
  });
});
