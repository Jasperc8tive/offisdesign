import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
import { MAX_MONEY, buildSnapshot, cartFingerprint, readSnapshot } from './checkout.snapshot';
import type { SetAddressInput, SetShippingMethodInput } from './dto/checkout.dto';

/** Who is asking for a checkout or order: a signed-in customer and/or a cart cookie. */
export interface CheckoutOwner {
  customerId?: string;
  anonymousId?: string;
}

const DEFAULT_WAREHOUSE_CODE = process.env.DEFAULT_WAREHOUSE_CODE ?? 'WH-MAIN';

/** Holds the per-session advisory lock across the provider confirm call. */
const PLACE_TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

@Injectable()
export class CheckoutApplicationService {
  private readonly logger = new Logger(CheckoutApplicationService.name);

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

  /**
   * The requester must own the session's cart: its customer if the cart
   * belongs to an account, otherwise the holder of its anonymous cookie.
   * 404 (not 403) so session ids can't be probed.
   */
  async assertAccess(checkoutId: string, owner: CheckoutOwner) {
    const session = await this.repo.findById(checkoutId);
    const cart = session ? await this.carts.findById(session.cartId) : null;
    if (!session || !cart || !ownsCart(cart, owner)) throw new NotFoundException();
  }

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

  /**
   * The client only names a rate; the price comes from a fresh server-side
   * quote so it can't be forged.
   */
  async setShippingMethod(checkoutId: string, method: SetShippingMethodInput) {
    const rate = await this.resolveRate(checkoutId, method.rateId);
    return this.domain.setShippingMethod(
      checkoutId,
      rate as unknown as Prisma.InputJsonValue,
      rate.amount,
    );
  }

  private async resolveRate(checkoutId: string, rateId: string) {
    const rates = await this.getShippingRates(checkoutId);
    const rate = rates.find((r) => r.id === rateId);
    if (!rate) {
      throw new BadRequestException({
        code: 'INVALID_SHIPPING_RATE',
        message: 'That delivery option is no longer available.',
      });
    }
    return rate;
  }

  /**
   * Compute review totals — subtotal, discount, tax, shipping, total — and
   * persist them on the session together with a snapshot of the priced cart
   * lines. Idempotent.
   */
  async computeReview(checkoutId: string) {
    const session = await this.repo.findById(checkoutId);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    const cart = await this.carts.findById(session.cartId);
    if (!cart) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (cart.items.length === 0) throw new BadRequestException({ code: 'CART_EMPTY' });
    if (!session.shippingAddress) {
      throw new BadRequestException({ code: 'NO_SHIPPING_ADDRESS' });
    }
    const method = session.shippingMethod as { id?: string } | null;
    if (!method?.id) {
      throw new BadRequestException({ code: 'NO_SHIPPING_METHOD' });
    }
    // Re-quote: the cart may have crossed a free-shipping threshold since the
    // method was chosen.
    const shippingAmount = (await this.resolveRate(checkoutId, method.id)).amount;
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
      shippingAmount,
      discountAmount: quote.discount,
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
      shippingAmount,
      taxAmount: taxQuote.totalTax,
      discountAmount: quote.discount,
      totalAmount: quote.total + shippingAmount + taxQuote.totalTax,
    };
    // Money columns are int4 (kobo) until the BigInt migration: stop oversized
    // orders here, before anything is snapshotted or charged.
    const largestLine = Math.max(...cart.items.map((i) => i.unitAmount * i.quantity));
    if (Math.max(totals.totalAmount, totals.subtotalAmount, largestLine) > MAX_MONEY) {
      throw new UnprocessableEntityException({
        code: 'ORDER_TOO_LARGE',
        message: 'Orders of this size are handled by our team — please request a quote.',
      });
    }
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: cart.items.map((i) => i.variantId) } },
      include: { product: true },
    });
    const updated = await this.domain.setTotals(checkoutId, totals, buildSnapshot(cart, variants));
    return { session: updated, quote, taxQuote };
  }

  /**
   * Create (or reuse) a payment intent for the reviewed totals. Idempotent on
   * the checkout session; a reused intent is re-priced if the total changed.
   */
  async createPaymentIntent(checkoutId: string) {
    const session = await this.repo.findById(checkoutId);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (session.status === CheckoutStatus.COMPLETED) {
      throw new BadRequestException({ code: 'ALREADY_COMPLETED' });
    }
    const snapshot = readSnapshot(session.cartSnapshot);
    if (session.totalAmount <= 0 || !snapshot) {
      throw new BadRequestException({
        code: 'NO_TOTAL',
        message: 'Compute totals before payment.',
      });
    }
    const cart = await this.carts.findById(session.cartId);
    if (!cart || cartFingerprint(cart) !== snapshot.fingerprint) {
      throw new ConflictException({
        code: 'CHECKOUT_STALE',
        message: 'Your cart changed. Please review your order again.',
      });
    }
    if (session.paymentIntentRef && session.paymentProvider) {
      let intent = await this.payment.retrieve(session.paymentIntentRef);
      if (intent.amount !== session.totalAmount) {
        if (intent.status === 'succeeded') {
          throw new ConflictException({
            code: 'PAYMENT_AMOUNT_MISMATCH',
            message: 'This payment no longer matches your order total.',
          });
        }
        intent = await this.payment.updateAmount(intent.providerRef, session.totalAmount);
      }
      return {
        provider: session.paymentProvider,
        providerRef: intent.providerRef,
        clientSecret: intent.clientSecret,
        status: intent.status,
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
      status: intent.status,
    };
  }

  /**
   * Place the order from the reviewed snapshot.
   *
   * The whole pipeline runs inside one Prisma transaction that first takes a
   * per-session advisory lock, so concurrent `/place` calls (double-clicks,
   * retries, the 3DS return) are serialized: the loser re-reads the session,
   * sees COMPLETED and returns the existing order.
   *
   * Sequence:
   *   1. Lock, re-read session, short-circuit on replay.
   *   2. Reserve stock for every snapshot line.
   *   3. Confirm the payment with the provider; amount + currency must equal
   *      the reviewed total.
   *   4. Persist order + items + payment + ledger, mark cart CHECKED_OUT and
   *      session COMPLETED — all on the transaction client.
   *   5. Commit reservations (decrement onHand) after the transaction.
   *   6. Emit `payment.succeeded` + `order.placed` + `checkout.completed`.
   *
   * Any failure in 2–4 releases the reservations taken by this call.
   */
  async placeOrder(checkoutId: string, paymentIntentRef?: string) {
    const reservations: string[] = [];
    let result: Awaited<ReturnType<CheckoutApplicationService['placeInLock']>>;
    try {
      result = await this.prisma.$transaction(
        (tx) => this.placeInLock(tx, checkoutId, paymentIntentRef, reservations),
        PLACE_TX_OPTIONS,
      );
    } catch (err) {
      for (const id of reservations) {
        await this.inventory.release(id).catch(() => undefined);
      }
      throw err;
    }
    if (result.replay) return result.order;

    const { order, session, confirmed } = result;
    for (const id of reservations) {
      await this.inventory.commit(id).catch(async (err: unknown) => {
        const reason = err instanceof Error ? err.message : String(err);
        this.logger.error(`Commit of reservation ${id} for order ${order.id} failed: ${reason}`);
        await this.events.publish('inventory.commit_failed', 'order', order.id, {
          orderId: order.id,
          reservationId: id,
          reason,
        });
      });
    }

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

  private async placeInLock(
    tx: Prisma.TransactionClient,
    checkoutId: string,
    paymentIntentRef: string | undefined,
    reservations: string[],
  ) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${checkoutId}))`;

    const session = await this.repo.findById(checkoutId, tx);
    if (!session) throw new BadRequestException({ code: 'NOT_FOUND' });
    if (session.status === CheckoutStatus.COMPLETED && session.orderId) {
      const existing = await this.orders.findById(session.orderId);
      if (existing) return { replay: true as const, order: existing };
    }
    if (!session.paymentIntentRef || !session.paymentProvider) {
      throw new BadRequestException({ code: 'NO_PAYMENT_INTENT' });
    }
    if (paymentIntentRef && paymentIntentRef !== session.paymentIntentRef) {
      throw new BadRequestException({ code: 'PAYMENT_REF_MISMATCH' });
    }
    const snapshot = readSnapshot(session.cartSnapshot);
    if (!snapshot || snapshot.lines.length === 0) {
      throw new BadRequestException({ code: 'NOT_REVIEWED', message: 'Review your order first.' });
    }
    if (!session.shippingAddress) {
      throw new BadRequestException({ code: 'NO_SHIPPING_ADDRESS' });
    }

    // Resolve the default warehouse (single-warehouse launch).
    const warehouse = await tx.warehouse.findUnique({
      where: { code: DEFAULT_WAREHOUSE_CODE },
    });
    if (!warehouse) {
      throw new BadRequestException({
        code: 'NO_WAREHOUSE',
        message: `Default warehouse "${DEFAULT_WAREHOUSE_CODE}" is not configured.`,
      });
    }

    // 2. Reserve stock for exactly what was reviewed.
    for (const line of snapshot.lines) {
      const reserved = await this.inventory.reserve(
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
      reservations.push(reserved.reservation.id);
    }

    // 3. Confirm payment with the provider and reconcile against the total.
    const confirmed = await this.payment.confirm(session.paymentIntentRef);
    if (confirmed.status !== 'succeeded') {
      await this.events.publish('payment.failed', 'checkout_session', session.id, {
        orderId: session.id,
        provider: session.paymentProvider,
        providerRef: session.paymentIntentRef,
        reason: confirmed.failureReason ?? confirmed.status,
      });
      throw new BadRequestException({
        code: 'PAYMENT_NOT_SUCCEEDED',
        message: confirmed.failureReason ?? 'Payment was not successful.',
      });
    }
    if (confirmed.amount !== session.totalAmount || confirmed.currency !== session.currency) {
      await this.events.publish('payment.amount_mismatch', 'checkout_session', session.id, {
        checkoutId: session.id,
        provider: session.paymentProvider,
        providerRef: session.paymentIntentRef,
        expectedAmount: session.totalAmount,
        expectedCurrency: session.currency,
        actualAmount: confirmed.amount,
        actualCurrency: confirmed.currency,
      });
      throw new ConflictException({
        code: 'PAYMENT_AMOUNT_MISMATCH',
        message: 'Your payment did not match the order total. Our team will contact you.',
      });
    }

    // 4. Persist everything on the transaction client.
    const orderNumber = generateOrderNumber();
    const order = await this.orders.create(
      {
        id: uuidv7(),
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
          create: snapshot.lines.map((l) => ({
            id: uuidv7(),
            variantId: l.variantId,
            productName: l.productName,
            ...(l.variantName ? { variantName: l.variantName } : {}),
            sku: l.sku,
            quantity: l.quantity,
            unitAmount: l.unitAmount,
            totalAmount: l.unitAmount * l.quantity,
            currency: l.currency,
          })),
        },
      },
      tx,
    );
    await this.payments.create(
      {
        id: uuidv7(),
        orderId: order.id,
        provider: session.paymentProvider,
        providerRef: session.paymentIntentRef,
        amount: confirmed.amount,
        currency: confirmed.currency,
        status: PaymentStatus.CAPTURED,
        providerData: confirmed.raw as object,
      },
      tx,
    );
    await this.orders.appendEvent(
      { id: uuidv7(), orderId: order.id, kind: 'OrderPlaced', payload: { number: orderNumber } },
      tx,
    );
    await tx.cart.update({ where: { id: session.cartId }, data: { status: 'CHECKED_OUT' } });
    const completed = await this.repo.update(
      session.id,
      session.version,
      {
        status: CheckoutStatus.COMPLETED,
        orderId: order.id,
        reservationIds: [...session.reservationIds, ...reservations],
      },
      tx,
    );
    if (!completed) {
      // The session changed under us (e.g. address edited mid-placement);
      // roll back so nothing is half-written.
      throw new ConflictException({ code: 'STALE_VERSION' });
    }

    return { replay: false as const, order, session, confirmed };
  }

  async listOrders(customerId: string, page: number, pageSize: number) {
    const [data, total] = await this.orders.listForCustomer(customerId, { page, pageSize });
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  /**
   * Account orders are visible to their customer only. Guest orders are
   * visible to the anonymous cart cookie that placed them.
   */
  async getOrder(orderId: string, owner: CheckoutOwner) {
    const order = await this.orders.findById(orderId);
    if (!order) return null;
    if (order.customerId) return order.customerId === owner.customerId ? order : null;
    if (!owner.anonymousId) return null;
    const session = await this.prisma.checkoutSession.findUnique({
      where: { orderId },
      select: { cartId: true },
    });
    const cart = session ? await this.carts.findById(session.cartId) : null;
    return cart && !cart.customerId && cart.anonymousId === owner.anonymousId ? order : null;
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

function ownsCart(
  cart: { customerId: string | null; anonymousId: string | null },
  owner: CheckoutOwner,
): boolean {
  if (cart.customerId) return cart.customerId === owner.customerId;
  return !!cart.anonymousId && cart.anonymousId === owner.anonymousId;
}
