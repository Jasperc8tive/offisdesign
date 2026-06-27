import { signPayload, verifySignature } from './hmac';

describe('webhook HMAC', () => {
  const secret = 'whsec_test_super_secret';
  const payload = JSON.stringify({ id: 'evt_1', type: 'order.placed' });

  it('round-trips a signature', () => {
    const sig = signPayload(secret, payload, 1_700_000_000);
    expect(verifySignature(secret, payload, sig)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const sig = signPayload(secret, payload, 1_700_000_000);
    expect(verifySignature(secret, '{"tampered":true}', sig)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const sig = signPayload(secret, payload, 1_700_000_000);
    expect(verifySignature('whsec_other', payload, sig)).toBe(false);
  });

  it('rejects a malformed header', () => {
    expect(verifySignature(secret, payload, 'not-a-signature')).toBe(false);
    expect(verifySignature(secret, payload, 't=abc,v1=xyz')).toBe(false);
  });

  it('honours maxAgeSec', () => {
    const sig = signPayload(secret, payload, Math.floor(Date.now() / 1000) - 600);
    expect(verifySignature(secret, payload, sig, { maxAgeSec: 300 })).toBe(false);
    expect(verifySignature(secret, payload, sig, { maxAgeSec: 3600 })).toBe(true);
  });
});
