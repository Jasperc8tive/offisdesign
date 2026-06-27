import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CheckoutStatus, type CheckoutSession } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { CheckoutRepository } from './checkout.repository';
import { CartRepository } from '../cart/cart.repository';
import type { Prisma } from '@offisdesign/database';
import type { ApiEnv } from '@offisdesign/config';
import { Inject } from '@nestjs/common';
import { API_ENV } from '../config/config.module';

const RETRY_ATTEMPTS = 4;

@Injectable()
export class CheckoutDomainService {
  constructor(
    private readonly repo: CheckoutRepository,
    private readonly carts: CartRepository,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async startOrResume(cartId: string, email: string, customerId?: string) {
    const cart = await this.carts.findById(cartId);
    if (!cart) throw new NotFoundException();
    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'CART_NOT_ACTIVE' });
    }
    if (cart.items.length === 0) {
      throw new BadRequestException({ code: 'CART_EMPTY' });
    }
    const existing = await this.repo.findByCart(cartId);
    if (existing && existing.status === CheckoutStatus.PENDING) {
      return existing;
    }
    if (existing && existing.status === CheckoutStatus.AWAITING_PAYMENT) {
      // Resume awaiting payment.
      return existing;
    }
    const expiresAt = new Date(Date.now() + this.env.CHECKOUT_TTL_MIN * 60 * 1000);
    return this.repo.create({
      id: uuidv7(),
      cartId,
      ...(customerId ? { customerId } : {}),
      email,
      currency: cart.currency,
      reservationIds: [],
      expiresAt,
      status: CheckoutStatus.PENDING,
    });
  }

  async setShippingAddress(checkoutId: string, addressJson: Prisma.InputJsonValue) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, { shippingAddress: addressJson }),
    );
  }

  async setBillingAddress(checkoutId: string, addressJson: Prisma.InputJsonValue) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, { billingAddress: addressJson }),
    );
  }

  async setShippingMethod(checkoutId: string, methodJson: Prisma.InputJsonValue, amount: number) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, {
        shippingMethod: methodJson,
        shippingAmount: amount,
      }),
    );
  }

  async setTotals(
    checkoutId: string,
    totals: {
      subtotalAmount: number;
      shippingAmount: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
    },
  ) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, totals),
    );
  }

  async setPaymentIntent(checkoutId: string, provider: string, providerRef: string) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, {
        paymentProvider: provider,
        paymentIntentRef: providerRef,
        status: CheckoutStatus.AWAITING_PAYMENT,
      }),
    );
  }

  async attachReservations(checkoutId: string, reservationIds: string[]) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, {
        reservationIds: [...session.reservationIds, ...reservationIds],
      }),
    );
  }

  async markCompleted(checkoutId: string, orderId: string) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, {
        status: CheckoutStatus.COMPLETED,
        orderId,
      }),
    );
  }

  async markCancelled(checkoutId: string) {
    return this.withRetry(checkoutId, (session) =>
      this.repo.update(session.id, session.version, { status: CheckoutStatus.CANCELLED }),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async withRetry(
    checkoutId: string,
    fn: (session: CheckoutSession) => Promise<CheckoutSession | null>,
  ): Promise<CheckoutSession> {
    for (let i = 0; i < RETRY_ATTEMPTS; i++) {
      const session = await this.repo.findById(checkoutId);
      if (!session) throw new NotFoundException();
      const result = await fn(session);
      if (result) return result;
    }
    throw new ConflictException({ code: 'STALE_VERSION' });
  }
}
