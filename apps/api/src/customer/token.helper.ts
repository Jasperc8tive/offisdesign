import { createHash, randomBytes } from 'node:crypto';

/**
 * Generate a verification token: 32 bytes encoded as URL-safe base64. The raw
 * token is delivered out-of-band (email link); only the SHA-256 hex digest
 * is persisted, so a DB leak cannot be replayed against the verification
 * endpoint.
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
