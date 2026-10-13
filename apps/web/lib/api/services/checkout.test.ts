import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutService } from './checkout';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const session = {
  id: 's1',
  cartId: 'c1',
  customerId: null,
  email: 'buyer@example.ng',
  currency: 'NGN',
  shippingAddress: null,
  billingAddress: null,
  shippingMethod: { id: 'express' },
  subtotalAmount: 0,
  shippingAmount: 4_000,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 0,
  status: 'PENDING',
  paymentProvider: null,
  paymentIntentRef: null,
  expiresAt: '2026-10-13T12:00:00.000Z',
};

describe('checkoutService.setShippingMethod', () => {
  it('sends only the rate id — the server owns the price', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await checkoutService.setShippingMethod('s1', { rateId: 'express' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/v1/checkout/s1/shipping-method');
    expect(JSON.parse(init.body as string)).toEqual({ rateId: 'express' });
  });
});
