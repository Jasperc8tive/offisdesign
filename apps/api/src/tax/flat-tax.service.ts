import { Inject, Injectable } from '@nestjs/common';
import type { ApiEnv } from '@offisdesign/config';
import { API_ENV } from '../config/config.module';
import type { TaxLine, TaxQuote, TaxRequest, TaxService } from './tax.interface';

/**
 * Flat-rate tax engine. The whole order is taxed at `TAX_FLAT_RATE_BPS` (basis
 * points). Suitable for single-country launches; real regional engines slot in
 * behind the same TaxService interface.
 */
@Injectable()
export class FlatTaxService implements TaxService {
  readonly name = 'flat';

  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  async calculate(req: TaxRequest): Promise<TaxQuote> {
    const rateBps = this.env.TAX_FLAT_RATE_BPS;
    const lines: TaxLine[] = req.lines.map((l) => {
      const taxableAmount = l.unitAmount * l.quantity;
      const taxAmount = Math.floor((taxableAmount * rateBps) / 10_000);
      return { variantId: l.variantId, taxableAmount, taxAmount, rateBps };
    });
    const shippingTaxAmount = Math.floor((req.shippingAmount * rateBps) / 10_000);
    const totalTax = lines.reduce((acc, l) => acc + l.taxAmount, 0) + shippingTaxAmount;
    return { currency: req.currency, lines, shippingTaxAmount, totalTax };
  }
}
