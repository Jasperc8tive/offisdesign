import type { ApiEnv } from '@offisdesign/config';
import { CheckoutApplicationService } from './checkout.app';
import { CheckoutDomainService } from './checkout.domain';
import { MockPaymentService } from '../payments/mock-payment.service';
import { FlatShippingService } from '../shipping/flat-shipping.service';

/**
 * In-memory harness: real domain, shipping and mock payment provider; the
 * repositories, Prisma, inventory, pricing and tax are minimal fakes.
 */
function harness() {
  const env = { CHECKOUT_TTL_MIN: 30, SHIPPING_FLAT_AMOUNT: 2_500 } as unknown as ApiEnv;
  const cart = {
    id: 'cart-1',
    status: 'ACTIVE',
    currency: 'NGN',
    appliedCoupon: null as string | null,
    items: [{ variantId: 'v1', quantity: 2, unitAmount: 10_000, currency: 'NGN' }],
  };
  const sessions = new Map<string, any>();
  const orders = new Map<string, any>();
  const payments: unknown[] = [];

  const checkoutRepo = {
    findById: jest.fn(async (id: string) => (sessions.has(id) ? { ...sessions.get(id) } : null)),
    findByCart: jest.fn(async () => null),
    create: jest.fn(async (data: { id: string } & Record<string, unknown>) => {
      const row = {
        version: 0,
        shippingAddress: null,
        billingAddress: null,
        shippingMethod: null,
        cartSnapshot: null,
        subtotalAmount: 0,
        shippingAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        paymentProvider: null,
        paymentIntentRef: null,
        orderId: null,
        customerId: null,
        ...data,
      };
      sessions.set(data.id, row);
      return { ...row };
    }),
    update: jest.fn(async (id: string, version: number, data: Record<string, unknown>) => {
      const row = sessions.get(id);
      if (!row || row.version !== version) return null;
      const next = { ...row, ...data, version: row.version + 1 };
      // Prisma.DbNull is an object sentinel; store it as a plain null.
      if (
        next.cartSnapshot &&
        typeof next.cartSnapshot === 'object' &&
        !('lines' in next.cartSnapshot)
      ) {
        next.cartSnapshot = null;
      }
      sessions.set(id, next);
      return { ...next };
    }),
  };
  const carts = {
    findById: jest.fn(async () => ({ ...cart, items: cart.items.map((i) => ({ ...i })) })),
  };
  const orderRepo = {
    findById: jest.fn(async (id: string) => orders.get(id) ?? null),
    create: jest.fn(async (data: { id: string; items: { create: unknown[] } }) => {
      const row = { ...data, items: data.items.create };
      orders.set(data.id, row);
      return row;
    }),
    appendEvent: jest.fn(async () => undefined),
  };
  const paymentRepo = { create: jest.fn(async (p: unknown) => payments.push(p)) };
  let reservationSeq = 0;
  const inventory = {
    reserve: jest.fn(async () => ({ reservation: { id: `res-${++reservationSeq}` } })),
    release: jest.fn(async () => undefined),
    commit: jest.fn(async () => undefined),
  };
  const tx = {
    $executeRaw: jest.fn(async () => 1),
    warehouse: { findUnique: jest.fn(async () => ({ id: 'wh-1' })) },
    cart: { update: jest.fn(async () => undefined) },
  };
  const prisma = {
    $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    productVariant: {
      findMany: jest.fn(async () => [
        { id: 'v1', sku: 'CHR-01', name: 'Black', product: { name: 'Task chair' } },
      ]),
    },
  };
  const pricing = {
    quote: jest.fn(async (req: { lines: { unitAmount: number; quantity: number }[] }) => {
      const subtotal = req.lines.reduce((a, l) => a + l.unitAmount * l.quantity, 0);
      return { subtotal, discount: 0, total: subtotal };
    }),
  };
  const tax = { calculate: jest.fn(async () => ({ totalTax: 1_500 })) };
  const events = { publish: jest.fn(async () => undefined) };
  const payment = new MockPaymentService();

  const domain = new CheckoutDomainService(checkoutRepo as never, carts as never, env);
  const app = new CheckoutApplicationService(
    domain,
    checkoutRepo as never,
    orderRepo as never,
    carts as never,
    pricing as never,
    inventory as never,
    paymentRepo as never,
    events as never,
    prisma as never,
    tax as never,
    new FlatShippingService(env),
    payment,
  );

  async function toPayment() {
    const session = await app.start(cart.id, 'buyer@example.ng');
    await app.setShippingAddress(session.id, {
      countryCode: 'NG',
      postcode: '100001',
    } as never);
    await app.setShippingMethod(session.id, { rateId: 'express' });
    await app.computeReview(session.id);
    const intent = await app.createPaymentIntent(session.id);
    return { sessionId: session.id, intent };
  }

  return {
    app,
    cart,
    sessions,
    orders,
    payments,
    inventory,
    events,
    payment,
    prisma,
    tx,
    toPayment,
  };
}

describe('CheckoutApplicationService', () => {
  it('prices shipping from the server rate and rejects unknown rates', async () => {
    const h = harness();
    const session = await h.app.start('cart-1', 'buyer@example.ng');
    await h.app.setShippingAddress(session.id, { countryCode: 'NG', postcode: '1' } as never);

    await expect(h.app.setShippingMethod(session.id, { rateId: 'teleport' })).rejects.toMatchObject(
      {
        response: { code: 'INVALID_SHIPPING_RATE' },
      },
    );

    // A forged `amount` in the body is simply not part of the schema/type.
    await h.app.setShippingMethod(session.id, { rateId: 'express', amount: 0 } as never);
    expect(h.sessions.get(session.id).shippingAmount).toBe(2_500 + 1_500);
  });

  it('computes the total including server shipping and tax', async () => {
    const h = harness();
    const { sessionId, intent } = await h.toPayment();
    const s = h.sessions.get(sessionId);
    expect(s.totalAmount).toBe(20_000 + 4_000 + 1_500);
    expect(intent.clientSecret).toBeTruthy();
    expect((await h.payment.retrieve(intent.providerRef)).amount).toBe(s.totalAmount);
  });

  it('refuses a payment intent when the cart changed after review', async () => {
    const h = harness();
    const session = await h.app.start('cart-1', 'buyer@example.ng');
    await h.app.setShippingAddress(session.id, { countryCode: 'NG', postcode: '1' } as never);
    await h.app.setShippingMethod(session.id, { rateId: 'standard' });
    await h.app.computeReview(session.id);
    h.cart.items[0]!.quantity = 20;
    await expect(h.app.createPaymentIntent(session.id)).rejects.toMatchObject({
      response: { code: 'CHECKOUT_STALE' },
    });
  });

  it('requires a fresh review after the shipping method changes', async () => {
    const h = harness();
    const { sessionId } = await h.toPayment();
    await h.app.setShippingMethod(sessionId, { rateId: 'standard' });
    await expect(h.app.createPaymentIntent(sessionId)).rejects.toMatchObject({
      response: { code: 'NO_TOTAL' },
    });
  });

  it('re-prices a reused intent and always returns its client secret', async () => {
    const h = harness();
    const { sessionId, intent } = await h.toPayment();
    await h.app.setShippingMethod(sessionId, { rateId: 'standard' });
    await h.app.computeReview(sessionId);
    const reused = await h.app.createPaymentIntent(sessionId);
    expect(reused.providerRef).toBe(intent.providerRef);
    expect(reused.clientSecret).toBeTruthy();
    expect((await h.payment.retrieve(intent.providerRef)).amount).toBe(20_000 + 2_500 + 1_500);
  });

  it('places the order from the snapshot, not the live cart', async () => {
    const h = harness();
    const { sessionId, intent } = await h.toPayment();
    h.cart.items.push({ variantId: 'v9', quantity: 20, unitAmount: 500_000, currency: 'NGN' });

    const order = await h.app.placeOrder(sessionId, intent.providerRef);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      variantId: 'v1',
      productName: 'Task chair',
      sku: 'CHR-01',
    });
    expect(order.totalAmount).toBe(h.sessions.get(sessionId).totalAmount);
    expect(h.sessions.get(sessionId).status).toBe('COMPLETED');
    expect(h.inventory.commit).toHaveBeenCalledTimes(1);
    expect(h.tx.$executeRaw).toHaveBeenCalled();
  });

  it('returns the existing order on replay without charging or reserving again', async () => {
    const h = harness();
    const { sessionId } = await h.toPayment();
    const first = await h.app.placeOrder(sessionId);
    const second = await h.app.placeOrder(sessionId);
    expect(second.id).toBe(first.id);
    expect(h.orders.size).toBe(1);
    expect(h.payments).toHaveLength(1);
    expect(h.inventory.reserve).toHaveBeenCalledTimes(1);
  });

  it('rejects a paid amount that differs from the total and releases stock', async () => {
    const h = harness();
    const { sessionId, intent } = await h.toPayment();
    await h.payment.updateAmount(intent.providerRef, 1);

    await expect(h.app.placeOrder(sessionId)).rejects.toMatchObject({
      response: { code: 'PAYMENT_AMOUNT_MISMATCH' },
    });
    expect(h.orders.size).toBe(0);
    expect(h.inventory.release).toHaveBeenCalledWith('res-1');
    expect(h.events.publish).toHaveBeenCalledWith(
      'payment.amount_mismatch',
      'checkout_session',
      sessionId,
      expect.objectContaining({ actualAmount: 1 }),
    );
  });

  it('rejects a payment ref that is not the session intent', async () => {
    const h = harness();
    const { sessionId } = await h.toPayment();
    await expect(h.app.placeOrder(sessionId, 'pi_someone_else')).rejects.toMatchObject({
      response: { code: 'PAYMENT_REF_MISMATCH' },
    });
  });

  it('releases reservations when persistence fails', async () => {
    const h = harness();
    const { sessionId } = await h.toPayment();
    h.tx.cart.update.mockRejectedValueOnce(new Error('db down'));
    await expect(h.app.placeOrder(sessionId)).rejects.toThrow('db down');
    expect(h.inventory.release).toHaveBeenCalledWith('res-1');
    expect(h.inventory.commit).not.toHaveBeenCalled();
  });
});
