/**
 * Sortable, human-readable order number.
 * Format: `OD-<yyyymm>-<7-char crockford base32 random>`.
 */
import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateOrderNumber(now = new Date()): string {
  const yy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const random = randomBytes(5);
  let suffix = '';
  for (let i = 0; i < 7; i++) {
    suffix += ALPHABET[random[i % random.length]! % ALPHABET.length];
  }
  return `OD-${yy}${mm}-${suffix}`;
}
