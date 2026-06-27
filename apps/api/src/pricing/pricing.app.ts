import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { DiscountRepository } from './discount.repository';
import { PromotionEngineService } from './promotion-engine.service';
import type { DiscountInput, DiscountPatch, Quote, QuoteRequest } from './dto/pricing.dto';

@Injectable()
export class PricingApplicationService {
  constructor(
    private readonly discounts: DiscountRepository,
    private readonly engine: PromotionEngineService,
  ) {}

  list() {
    return this.discounts.list();
  }

  async create(input: DiscountInput) {
    if (input.code) {
      const existing = await this.discounts.findByCode(input.code);
      if (existing && !existing.deletedAt) {
        throw new ConflictException({ code: 'CODE_TAKEN', message: 'Coupon code already exists.' });
      }
    }
    return this.discounts.create({
      id: uuidv7(),
      name: input.name,
      ...(input.code ? { code: input.code } : {}),
      kind: input.kind,
      value: input.value,
      ...(input.currency ? { currency: input.currency } : {}),
      scope: input.scope,
      targetIds: input.targetIds,
      ...(input.minSubtotal !== undefined ? { minSubtotal: input.minSubtotal } : {}),
      ...(input.startsAt ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt ? { endsAt: input.endsAt } : {}),
      ...(input.usageLimit !== undefined ? { usageLimit: input.usageLimit } : {}),
      isActive: input.isActive,
    });
  }

  async update(id: string, input: DiscountPatch) {
    const existing = await this.discounts.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    return this.discounts.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.targetIds !== undefined ? { targetIds: input.targetIds } : {}),
      ...(input.minSubtotal !== undefined ? { minSubtotal: input.minSubtotal } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.usageLimit !== undefined ? { usageLimit: input.usageLimit } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  async delete(id: string) {
    const existing = await this.discounts.findById(id);
    if (!existing) throw new NotFoundException();
    return this.discounts.softDelete(id);
  }

  /** Pure quote — no persistence. Used by cart/checkout (Stage 6+). */
  async quote(req: QuoteRequest): Promise<Quote> {
    const active = await this.discounts.findActive();
    const requested = req.couponCodes.length
      ? await Promise.all(req.couponCodes.map((c) => this.discounts.findByCode(c)))
      : [];
    const byCode = requested.filter(
      (d): d is NonNullable<typeof d> => d != null && d.isActive && !d.deletedAt,
    );
    return this.engine.apply(req, { active: active.filter((d) => d.code === null), byCode });
  }
}
