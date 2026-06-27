import { MockPaymentService } from './mock-payment.service';

describe('MockPaymentService', () => {
  const svc = new MockPaymentService();

  it('creates an intent that can be confirmed', async () => {
    const intent = await svc.createIntent({
      amount: 12_000,
      currency: 'GBP',
      reference: 'checkout-1',
    });
    expect(intent.providerRef).toMatch(/^mock_pi_/);
    expect(intent.clientSecret).toContain(intent.providerRef);

    const confirmed = await svc.confirm(intent.providerRef);
    expect(confirmed.status).toBe('succeeded');
    expect(confirmed.amount).toBe(12_000);
    expect(confirmed.currency).toBe('GBP');
  });

  it('fails to confirm an unknown intent', async () => {
    const confirmed = await svc.confirm('mock_pi_does_not_exist');
    expect(confirmed.status).toBe('failed');
    expect(confirmed.failureReason).toBe('unknown_intent');
  });

  it('refunds an arbitrary amount', async () => {
    const refund = await svc.refund({ providerRef: 'mock_pi_abc', amount: 5_000 });
    expect(refund.status).toBe('succeeded');
    expect(refund.amount).toBe(5_000);
  });

  it('webhook parse is a no-op for mock provider', () => {
    const event = svc.parseWebhook(Buffer.from(''), undefined);
    expect(event.type).toBe('mock.event');
  });
});
