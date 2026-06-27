import { Injectable } from '@nestjs/common';
import { CartDomainService } from './cart.domain';
import { CartRepository } from './cart.repository';
import { EventBus } from '../events/event-bus.service';
import { PricingApplicationService } from '../pricing/pricing.app';
import type { Cart, CartItem } from '@offisdesign/database';

export interface CartView {
  cart: Cart & { items: CartItem[] };
  subtotal: number;
  discount: number;
  total: number;
  appliedDiscountIds: string[];
}

@Injectable()
export class CartApplicationService {
  constructor(
    private readonly domain: CartDomainService,
    private readonly repo: CartRepository,
    private readonly events: EventBus,
    private readonly pricing: PricingApplicationService,
  ) {}

  async resolveOrCreate(input: { customerId?: string; anonymousId?: string; currency?: string }) {
    const fresh = await this.domain.getOrCreate(input);
    if (fresh.createdAt.getTime() === fresh.updatedAt.getTime()) {
      await this.events.publish('cart.created', 'cart', fresh.id, {
        cartId: fresh.id,
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.anonymousId ? { anonymousId: input.anonymousId } : {}),
      });
    }
    return this.view(fresh);
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    const cart = await this.domain.addItem(cartId, variantId, quantity);
    await this.events.publish('cart.item-added', 'cart', cart.id, {
      cartId: cart.id,
      variantId,
      quantity,
    });
    return this.view(cart);
  }

  async updateItem(cartId: string, variantId: string, quantity: number) {
    const cart = await this.domain.updateItem(cartId, variantId, quantity);
    if (quantity === 0) {
      await this.events.publish('cart.item-removed', 'cart', cart.id, {
        cartId: cart.id,
        variantId,
      });
    }
    return this.view(cart);
  }

  async removeItem(cartId: string, variantId: string) {
    const cart = await this.domain.removeItem(cartId, variantId);
    await this.events.publish('cart.item-removed', 'cart', cart.id, { cartId: cart.id, variantId });
    return this.view(cart);
  }

  async clear(cartId: string) {
    const cart = await this.domain.clear(cartId);
    await this.events.publish('cart.cleared', 'cart', cart.id, { cartId: cart.id });
    return this.view(cart);
  }

  async applyCoupon(cartId: string, code: string | null) {
    const cart = await this.domain.applyCoupon(cartId, code);
    return this.view(cart);
  }

  async attachEmail(cartId: string, email: string) {
    const cart = await this.domain.attachEmail(cartId, email);
    return this.view(cart);
  }

  async merge(fromId: string, intoId: string, customerId: string) {
    const merged = await this.domain.merge(fromId, intoId);
    if (!merged) return null;
    await this.events.publish('cart.merged', 'cart', intoId, {
      fromCartId: fromId,
      intoCartId: intoId,
      customerId,
    });
    return this.view(merged);
  }

  async get(cartId: string) {
    const cart = await this.repo.findById(cartId);
    if (!cart) return null;
    return this.view(cart);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async view(
    cart: NonNullable<Awaited<ReturnType<CartRepository['findById']>>>,
  ): Promise<CartView> {
    if (cart.items.length === 0) {
      return {
        cart,
        subtotal: 0,
        discount: 0,
        total: 0,
        appliedDiscountIds: [],
      };
    }
    const quote = await this.pricing.quote({
      currency: cart.currency,
      lines: cart.items.map((i) => ({
        variantId: i.variantId,
        productId: i.variantId, // resolved by pricing if it needs product; lines here carry variant-level price.
        collectionIds: [],
        unitAmount: i.unitAmount,
        quantity: i.quantity,
      })),
      couponCodes: cart.appliedCoupon ? [cart.appliedCoupon] : [],
    });
    return {
      cart,
      subtotal: quote.subtotal,
      discount: quote.discount,
      total: quote.total,
      appliedDiscountIds: quote.appliedDiscountIds,
    };
  }
}
