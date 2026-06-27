import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CheckoutStatus, PaymentStatus, type Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { CheckoutDomainService } from './checkout.domain';
import { CheckoutRepository } from './checkout.repository';
import { OrderRepository } from './order.repository';
import { CartRepository } from '../cart/cart.repository';
import { PricingApplicationService } from '../pricing/pricing.app';
import { TAX_SERVICE, type TaxService } from '../tax/tax.interface';
import { SHIPPING_SERVICE, type ShippingService } from '../shipping/shipping.interface';
import { PAYMENT_SERVICE, type PaymentService } from '../payments/payment.interface';
import { PaymentRepository } from '../payments/payment.repository';
import { InventoryApplicationService } from '../inventory/inventory.app';
import { EventBus } from '../events/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { generateOrderNumber } from './order-number';
import type { SetAddressInput, SetShippingMethodInput } from './dto/checkout.dto';

const DEFAULT_WAREHOUSE_CODE = process.env.DEFAULT_WAREHOUSE_CODE ?? 'WH-MAIN';

@Injectable()
export class CheckoutApplicationService {
  constructor(
    private readonly domain: CheckoutDomainService,
    private readonly repo: CheckoutRepository,
    private readonly orders: OrderRepository,
    private readonly carts: CartRepository,
    private readonly pricing: PricingApplicationService,
    private readonly inventory: InventoryApplicationService,
    private readonly payments: PaymentRepository,
    private readonly events: EventBus,
    private readonly prisma: PrismaService,
    @Inject(TAX_SERVICE) private readonly tax: TaxService,
    @Inject(SHIPPING_SERVICE) private readonly shipping: ShippingService,
    @Inject(PAYMENT_SERVICE) private readonly payment: PaymentService,
  ) {}

  async start(cartId: string, email: string, customerId?: string) {
    const session = await this.domain.startOrResume(cartId, email, customerId);
    await this.events.publish('checkout.started', 'checkout_session', session.id, {
      checkoutId: session.id,
      cartId,
    });
    return session;
  }

  setShippingAddress(checkoutId: string, address: SetAddressInput) {
    return this.domain.setShippingAddress(checkoutId, address as unknown as Prisma.InputJsonValue);
  }

  setBillingAddress(checkoutId: string, address: SetAddressInput) {
    return this.domain.setBillingAddress(checkoutId, address as unknown as Prisma.InputJsonValue);
  }

  async getShippingRates(checkoutId: string) {
    const session = await this.repo.findById(checkoutId);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    const cart = await this.carts.findById(session.cartId);
    if (!cart) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (!session.shippingAddress) {
      throw new BadRequestException({ code: 'NO_SHIPPING_ADDRESS' });
    }
    const dest = session.shippingAddress as { countryCode: string; postcode: string };
    const subtotal = cart.items.reduce((acc, i) => acc + i.unitAmount * i.quantity, 0);
    return this.shipping.rates({
      currency: cart.currency,
      subtotal,
      destination: { countryCode: dest.countryCode, postcode: dest.postcode },
      lines: cart.items.map((i) => ({
        variantId: i.variantId,
        weightGrams: null,
        quantity: i.quantity,
      })),
    });
  }

  async setShippingMethod(checkoutId: string, method: SetShippingMethodInput) {
    return this.domain.setShippingMethod(
      checkoutId,
      method as unknown as Prisma.InputJsonValue,
      method.amount,
    );
  }

  /**
   * Compute review totals — subtotal, discount, tax, shipping, total — and
   * persist them on the session. Idempotent.
   */
  async computeReview(checkoutId: string) {
    const session = await this.repo.findById(checkoutId);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    const cart = await this.carts.findById(session.cartId);
    if (!cart) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (!session.shippingAddress) {
      throw new BadRequestException({ code: 'NO_SHIPPING_ADDRESS' });
    }
    const ship = session.shippingAddress as { countryCode: string; region?: string };

    const quote = await this.pricing.quote({
      currency: cart.currency,
      lines: cart.items.map((i) => ({
        variantId: i.variantId,
        productId: i.variantId,
        collectionIds: [],
        unitAmount: i.unitAmount,
        quantity: i.quantity,
      })),
      couponCodes: cart.appliedCoupon ? [cart.appliedCoupon] : [],
    });

    const taxQuote = await this.tax.calculate({
      currency: cart.currency,
      destinationCountry: ship.countryCode,
      ...(ship.region ? { destinationRegion: ship.region } : {}),
      shippingAmount: session.shippingAmount,
      lines: cart.items.map((i) => ({
        variantId: i.variantId,
        productId: i.variantId,
        unitAmount: i.unitAmount,
        quantity: i.quantity,
        countryCode: ship.countryCode,
        ...(ship.region ? { region: ship.region } : {}),
      })),
    });

    const totals = {
      subtotalAmount: quote.subtotal,
      shippingAmount: session.shippingAmount,
      taxAmount: taxQuote.totalTax,
      discountAmount: quote.discount,
      totalAmount: quote.total + session.shippingAmount + taxQuote.totalTax,
    };
    const updated = await this.domain.setTotals(checkoutId, totals);
    return { session: updated, quote, taxQuote };
  }

  /**
   * Create (or reuse) a payment intent for the current totals. Idempotent on
   * the checkout session.
   */
  async createPaymentIntent(checkoutId: string) {
    const session = await this.repo.findById(checkoutId);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (session.status === CheckoutStatus.COMPLETED) {
      throw new BadRequestException({ code: 'ALREADY_COMPLETED' });
    }
    if (session.totalAmount <= 0) {
      throw new BadRequestException({
        code: 'NO_TOTAL',
        message: 'Compute totals before payment.',
      });
    }
    if (session.paymentIntentRef && session.paymentProvider) {
      return {
        provider: session.paymentProvider,
        providerRef: session.paymentIntentRef,
      };
    }
    const intent = await this.payment.createIntent({
      amount: session.totalAmount,
      currency: session.currency,
      reference: session.id,
      ...(session.customerId ? { customerId: session.customerId } : {}),
    });
    await this.domain.setPaymentIntent(session.id, this.payment.provider, intent.providerRef);
    return {
      provider: this.payment.provider,
      providerRef: intent.providerRef,
      clientSecret: intent.clientSecret,
    };
  }

  /**
   * Place the order. The pipeline is wrapped in a Prisma transaction so the
   * database mutations roll back together; inventory + payment side effects
   * are compensated outside the transaction if a later step fails.
   *
   * Sequence:
   *   1. Validate cart + session.
   *   2. Reserve stock for every line.
   *   3. Confirm the payment intent (re-verify with provider).
   *   4. Create the order row + items + payment + ledger.
   *   5. Commit reservations (decrement onHand).
   *   6. Clear cart, mark session COMPLETED.
   *   7. Emit `order.placed` + `payment.succeeded` + `checkout.completed`.
   */
  async placeOrder(checkoutId: string) {
    const session = await this.repo.findById(checkoutId);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (session.status === CheckoutStatus.COMPLETED && session.orderId) {
      const existing = await this.orders.findById(session.orderId);
      if (existing) return existing; // idempotent replay
    }
    if (!session.paymentIntentRef || !session.paymentProvider) {
      throw new BadRequestException({ code: 'NO_PAYMENT_INTENT' });
    }
    const cart = await this.carts.findById(session.cartId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({ code: 'CART_EMPTY' });
    }
    if (!session.shippingAddress) {
      throw new BadRequestException({ code: 'NO_SHIPPING_ADDRESS' });
    }

    // Resolve the default warehouse (single-warehouse launch).
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { code: DEFAULT_WAREHOUSE_CODE },
    });
    if (!warehouse) {
      throw new BadRequestException({
        code: 'NO_WAREHOUSE',
        message: `Default warehouse "${DEFAULT_WAREHOUSE_CODE}" is not configured.`,
      });
    }

    // 1. Reserve stock for every line. Re-uses existing reservations if any.
    const newReservations: string[] = [];
    for (const line of cart.items) {
      const result = await this.inventory.reserve(
        {
          variantId: line.variantId,
          warehouseId: warehouse.id,
          quantity: line.quantity,
          contextType: 'checkout',
          contextId: session.id,
          ttlSec: 30 * 60,
        },
        session.customerId ?? undefined,
      );
      newReservations.push(result.reservation.id);
    }
    if (newReservations.length > 0) {
      await this.domain.attachReservations(session.id, newReservations);
    }

    // 2. Confirm payment with provider.
    const confirmed = await this.payment.confirm(session.paymentIntentRef);
    if (confirmed.status !== 'succeeded') {
      await this.events.publish('payment.failed', 'checkout_session', session.id, {
        orderId: session.id,
        provider: session.paymentProvider,
        providerRef: session.paymentIntentRef,
        reason: confirmed.failureReason ?? confirmed.status,
      });
      // Release reservations on payment failure.
      for (const id of newReservations) {
        await this.inventory.release(id).catch(() => undefined);
      }
      throw new BadRequestException({
        code: 'PAYMENT_NOT_SUCCEEDED',
        message: confirmed.failureReason ?? 'Payment was not successful.',
      });
    }

    // 3. Persist order + payment + ledger inside a transaction.
    const orderId = uuidv7();
    const orderNumber = generateOrderNumber();
    const order = await this.orders.inTx(async (_tx) => {
      const created = await this.orders.create({
        id: orderId,
        number: orderNumber,
        ...(session.customerId ? { customerId: session.customerId } : {}),
        email: session.email,
        currency: session.currency,
        subtotalAmount: session.subtotalAmount,
        shippingAmount: session.shippingAmount,
        taxAmount: session.taxAmount,
        discountAmount: session.discountAmount,
        totalAmount: session.totalAmount,
        status: 'PAID',
        placedAt: new Date(),
        shippingAddress: session.shippingAddress as object,
        ...(session.billingAddress ? { billingAddress: session.billingAddress as object } : {}),
        items: {
          create: cart.items.map((i) => ({
            id: uuidv7(),
            variantId: i.variantId,
            productName: 'TBD', // resolved from variant lookup in production view
            sku: 'TBD',
            quantity: i.quantity,
            unitAmount: i.unitAmount,
            totalAmount: i.unitAmount * i.quantity,
            currency: i.currency,
          })),
        },
      });
      await this.payments.create({
        id: uuidv7(),
        orderId: created.id,
        provider: session.paymentProvider as string,
        providerRef: session.paymentIntentRef as string,
        amount: confirmed.amount,
        currency: confirmed.currency,
        status: PaymentStatus.CAPTURED,
        providerData: confirmed.raw as object,
      });
      await this.orders.appendEvent({
        id: uuidv7(),
        orderId: created.id,
        kind: 'OrderPlaced',
        payload: { number: orderNumber },
      });
      return created;
    });

    // 4. Commit reservations (decrement onHand). Outside the order tx so a
    //    failure here is a recoverable inventory issue, not a lost order.
    for (const id of newReservations) {
      await this.inventory.commit(id).catch(() => undefined);
    }

    // 5. Clear cart + mark session complete.
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { status: 'CHECKED_OUT' },
    });
    await this.domain.markCompleted(session.id, order.id);

    // 6. Events.
    await this.events.publish('payment.succeeded', 'order', order.id, {
      orderId: order.id,
      provider: session.paymentProvider as string,
      providerRef: session.paymentIntentRef as string,
      amount: confirmed.amount,
      currency: confirmed.currency,
    });
    await this.events.publish('order.placed', 'order', order.id, {
      orderId: order.id,
      ...(session.customerId ? { customerId: session.customerId } : {}),
      total: order.totalAmount,
      currency: order.currency,
    });
    await this.events.publish('checkout.completed', 'checkout_session', session.id, {
      checkoutId: session.id,
      orderId: order.id,
    });

    return order;
  }

  async listOrders(customerId: string, page: number, pageSize: number) {
    const [data, total] = await this.orders.listForCustomer(customerId, { page, pageSize });
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async getOrder(orderId: string, customerId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) return null;
    if (order.customerId && order.customerId !== customerId) return null;
    return order;
  }

  /** Cron entry — expire stale sessions and release their reservations. */
  async expireStale() {
    const expired = await this.repo.findExpired();
    let count = 0;
    for (const session of expired) {
      for (const id of session.reservationIds) {
        await this.inventory.release(id).catch(() => undefined);
      }
      await this.domain.markCancelled(session.id);
      await this.events.publish('checkout.expired', 'checkout_session', session.id, {
        checkoutId: session.id,
      });
      count++;
    }
    return count;
  }
}
