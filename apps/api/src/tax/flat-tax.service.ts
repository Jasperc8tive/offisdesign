import { Inject, Injectable } from '@nestjs/common';
import type { ApiEnv } from '@offisdesign/config';
import { API_ENV } from '../config/config.module';
import type { TaxLine, TaxQuote, TaxRequest, TaxService } from './tax.interface';

/**
 * Flat-rate tax engine. The whole order is taxed at `TAX_FLAT_RATE_BPS` (basis
 * points) — goods after the order discount, plus shipping. Suitable for
 * single-country launches; real regional engines slot in behind the same
 * TaxService interface.
 */
@Injectable()
export class FlatTaxService implements TaxService {
  readonly name = 'flat';

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  async calculate(req: TaxRequest): Promise<TaxQuote> {
    const rateBps = this.env.TAX_FLAT_RATE_BPS;
    const gross = req.lines.map((l) => l.unitAmount * l.quantity);
    const grossTotal = gross.reduce((acc, g) => acc + g, 0);
    const discount = Math.min(Math.max(req.discountAmount ?? 0, 0), grossTotal);

    // Spread the discount over lines pro rata; the last line takes the
    // rounding remainder so taxable amounts sum to (gross − discount).
    const taxable = allocate(gross, grossTotal - discount);
    const goodsTax = Math.floor(((grossTotal - discount) * rateBps) / 10_000);
    // Same for tax, so line taxes sum exactly to the goods tax.
    const lineTax = allocate(taxable, goodsTax);

    const lines: TaxLine[] = req.lines.map((l, i) => ({
      variantId: l.variantId,
      taxableAmount: taxable[i] ?? 0,
      taxAmount: lineTax[i] ?? 0,
      rateBps,
    }));
    const shippingTaxAmount = Math.floor((req.shippingAmount * rateBps) / 10_000);
    return {
      currency: req.currency,
      lines,
      shippingTaxAmount,
      totalTax: goodsTax + shippingTaxAmount,
    };
  }
}

/** Split `total` across `weights` proportionally; the last share absorbs rounding. */
function allocate(weights: number[], total: number): number[] {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (weights.length === 0) return [];
  if (sum === 0) return weights.map((_, i) => (i === weights.length - 1 ? total : 0));
  let assigned = 0;
  return weights.map((w, i) => {
    if (i === weights.length - 1) return total - assigned;
    // BigInt: w × total can exceed 2^53 on large orders.
    const share = Number((BigInt(w) * BigInt(total)) / BigInt(sum));
    assigned += share;
    return share;
  });
}
