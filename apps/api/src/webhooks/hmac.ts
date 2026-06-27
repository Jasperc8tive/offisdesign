import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Sign a webhook payload as
 *   `t=<unix>,v1=<hex-hmac-sha256>`
 * matching the Stripe convention. The signed string is `<unix>.<payload>` so a
 * replay against a different timestamp fails verification.
 */
export function signPayload(
  secret: string,
  payload: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): string {
  const signed = `${timestamp}.${payload}`;
  const mac = createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${timestamp},v1=${mac}`;
}

export interface VerifyOptions {
  /** Reject signatures older than this many seconds. */
  maxAgeSec?: number;
}

export function verifySignature(
  secret: string,
  payload: string,
  header: string,
  opts: VerifyOptions = {},
): boolean {
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k?.trim() ?? '', v?.trim() ?? ''] as const;
    }),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isFinite(t) || !v1) return false;
  if (opts.maxAgeSec !== undefined) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - t) > opts.maxAgeSec) return false;
  }
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  if (expected.length !== v1.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}
