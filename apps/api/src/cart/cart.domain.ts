import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';
import { CartRepository } from './cart.repository';

const RETRY_ATTEMPTS = 4;

/**
 * Cart domain. Pricing of line items is derived from the variant's `priceAmount`
 * at write time — the application service is responsible for recalculating
 * totals (including discounts/taxes) when the storefront requests the cart.
 */
@Injectable()
export class CartDomainService {
  constructor(
    private readonly repo: CartRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getOrCreate(input: { customerId?: string; anonymousId?: string; currency?: string }) {
    if (input.customerId) {
      const found = await this.repo.findActiveByCustomer(input.customerId);
      if (found) return found;
    }
    if (input.anonymousId) {
      const found = await this.repo.findActiveByAnonymous(input.anonymousId);
      if (found) return found;
    }
    if (!input.customerId && !input.anonymousId) {
      throw new BadRequestException({ code: 'NO_OWNER', message: 'Cart requires owner.' });
    }
    return this.repo.create({
      id: uuidv7(),
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.anonymousId ? { anonymousId: input.anonymousId } : {}),
      currency: input.currency ?? 'GBP',
      status: 'ACTIVE',
    });
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant || variant.deletedAt || !variant.product || variant.product.deletedAt) {
      throw new NotFoundException({ code: 'VARIANT_NOT_FOUND' });
    }
    if (variant.product.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'PRODUCT_INACTIVE' });
    }
    const existing = await this.repo.findById(cartId);
    if (!existing) throw new NotFoundException();
    if (existing.currency !== variant.priceCurrency) {
      throw new BadRequestException({
        code: 'CURRENCY_MISMATCH',
        message: `Cart is ${existing.currency} but variant is ${variant.priceCurrency}.`,
      });
    }
    const currentLine = existing.items.find((i) => i.variantId === variantId);
    const nextQty = (currentLine?.quantity ?? 0) + quantity;
    return this.withRetry(cartId, async (cart) => {
      await this.repo.upsertItem(
        cart.id,
        variantId,
        nextQty,
        variant.priceAmount,
        variant.priceCurrency,
      );
      const updated = await this.repo.update(cart.id, cart.version, {});
      return updated;
    });
  }

  async updateItem(cartId: string, variantId: string, quantity: number) {
    return this.withRetry(cartId, async (cart) => {
      if (quantity === 0) {
        await this.repo.removeItem(cart.id, variantId).catch(() => undefined);
      } else {
        const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!variant) throw new NotFoundException();
        await this.repo.upsertItem(
          cart.id,
          variantId,
          quantity,
          variant.priceAmount,
          variant.priceCurrency,
        );
      }
      return this.repo.update(cart.id, cart.version, {});
    });
  }

  async removeItem(cartId: string, variantId: string) {
    return this.withRetry(cartId, async (cart) => {
      await this.repo.removeItem(cart.id, variantId).catch(() => undefined);
      return this.repo.update(cart.id, cart.version, {});
    });
  }

  async clear(cartId: string) {
    return this.withRetry(cartId, async (cart) => {
      await this.repo.clearItems(cart.id);
      return this.repo.update(cart.id, cart.version, { appliedCoupon: null });
    });
  }

  async applyCoupon(cartId: string, code: string | null) {
    return this.withRetry(cartId, (cart) =>
      this.repo.update(cart.id, cart.version, { appliedCoupon: code }),
    );
  }

  async attachEmail(cartId: string, email: string) {
    return this.withRetry(cartId, (cart) => this.repo.update(cart.id, cart.version, { email }));
  }

  /**
   * Merge `from` cart's items into `into` cart. Quantities are summed; the
   * `from` cart is then marked ABANDONED.
   */
  async merge(fromId: string, intoId: string) {
    if (fromId === intoId) return this.repo.findById(intoId);
    const from = await this.repo.findById(fromId);
    const into = await this.repo.findById(intoId);
    if (!from || !into) throw new NotFoundException();
    if (from.currency !== into.currency) {
      throw new BadRequestException({ code: 'CURRENCY_MISMATCH' });
    }
    for (const line of from.items) {
      const matching = into.items.find((i) => i.variantId === line.variantId);
      const nextQty = (matching?.quantity ?? 0) + line.quantity;
      await this.repo.upsertItem(into.id, line.variantId, nextQty, line.unitAmount, line.currency);
    }
    await this.repo.clearItems(from.id);
    await this.repo.markStatus(from.id, 'ABANDONED');
    return this.repo.findById(into.id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async withRetry<T>(
    cartId: string,
    fn: (cart: NonNullable<Awaited<ReturnType<CartRepository['findById']>>>) => Promise<T | null>,
  ): Promise<T> {
    for (let i = 0; i < RETRY_ATTEMPTS; i++) {
      const cart = await this.repo.findById(cartId);
      if (!cart) throw new NotFoundException();
      const result = await fn(cart);
      if (result !== null) return result;
    }
    throw new ConflictException({ code: 'STALE_VERSION' });
  }
}
