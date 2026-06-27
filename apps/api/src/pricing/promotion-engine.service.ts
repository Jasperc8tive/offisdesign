import { Injectable } from '@nestjs/common';
import type { Discount } from '@offisdesign/database';
import type { Quote, QuoteLine, QuoteRequest } from './dto/pricing.dto';

interface PriceLine {
  variantId: string;
  productId: string;
  collectionIds: string[];
  unitAmount: number;
  quantity: number;
}

interface ApplyOptions {
  /** Auto-applied + currently-active discounts. */
  active: Discount[];
  /** Discounts matched from supplied coupon codes (already validated active). */
  byCode: Discount[];
}

/**
 * Promotion engine — pure calculation, no DB writes. Application service
 * loads the candidate discount set, calls `apply`, then persists usage rows.
 *
 * Apply order:
 *   1. PRODUCT-scoped discounts (per-line).
 *   2. COLLECTION-scoped discounts (per-line, when line is in target collection).
 *   3. CART-scoped discounts (against running subtotal).
 *
 * Within each scope, percent first then fixed. Best-discount-wins per line for
 * PRODUCT/COLLECTION; CART-scope discounts stack additively.
 */
@Injectable()
export class PromotionEngineService {
  apply(req: QuoteRequest, opts: ApplyOptions): Quote {
    const applied = new Set<string>();
    const auto = opts.active.filter((d) => d.code === null);
    const all = [...auto, ...opts.byCode];

    const lines: QuoteLine[] = req.lines.map((line) => {
      const lineSubtotal = line.unitAmount * line.quantity;
      const best = this.bestLineDiscount(all, line, applied, req.currency);
      const lineDiscount = best?.amount ?? 0;
      if (best) applied.add(best.discountId);
      return {
        variantId: line.variantId,
        unitAmount: line.unitAmount,
        quantity: line.quantity,
        lineSubtotal,
        lineDiscount,
        lineTotal: Math.max(0, lineSubtotal - lineDiscount),
      };
    });

    const subtotal = lines.reduce((acc, l) => acc + l.lineSubtotal, 0);
    let runningTotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
    let cartDiscount = 0;

    const cartScoped = all.filter((d) => d.scope === 'CART');
    for (const d of cartScoped) {
      if (d.minSubtotal && subtotal < d.minSubtotal) continue;
      if (d.usageLimit && d.usageCount >= d.usageLimit) continue;
      const amount = this.computeAmount(d, runningTotal, req.currency);
      if (amount <= 0) continue;
      const capped = Math.min(amount, runningTotal);
      cartDiscount += capped;
      runningTotal -= capped;
      applied.add(d.id);
    }

    const totalDiscount = lines.reduce((acc, l) => acc + l.lineDiscount, 0) + cartDiscount;

    return {
      currency: req.currency,
      lines,
      subtotal,
      discount: totalDiscount,
      total: Math.max(0, subtotal - totalDiscount),
      appliedDiscountIds: Array.from(applied),
    };
  }

  private bestLineDiscount(
    discounts: Discount[],
    line: PriceLine,
    alreadyApplied: Set<string>,
    currency: string,
  ): { discountId: string; amount: number } | null {
    let best: { discountId: string; amount: number } | null = null;
    for (const d of discounts) {
      if (alreadyApplied.has(d.id)) continue;
      if (d.scope === 'CART') continue;
      if (d.scope === 'PRODUCT' && !d.targetIds.includes(line.productId)) continue;
      if (d.scope === 'COLLECTION' && !d.targetIds.some((id) => line.collectionIds.includes(id))) {
        continue;
      }
      if (d.usageLimit && d.usageCount >= d.usageLimit) continue;
      const amount = this.computeAmount(d, line.unitAmount * line.quantity, currency);
      if (amount <= 0) continue;
      const capped = Math.min(amount, line.unitAmount * line.quantity);
      if (!best || capped > best.amount) best = { discountId: d.id, amount: capped };
    }
    return best;
  }

  private computeAmount(d: Discount, base: number, currency: string): number {
    if (d.kind === 'PERCENT') {
      return Math.floor((base * d.value) / 10_000);
    }
    if (d.currency && d.currency !== currency) return 0;
    return d.value;
  }
}
