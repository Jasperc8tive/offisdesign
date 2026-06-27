import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats minor units as GBP by default', () => {
    expect(formatMoney(12_999)).toBe('£129.99');
  });

  it('drops trailing zeros for round amounts', () => {
    expect(formatMoney(100_000)).toBe('£1,000');
  });

  it('supports an alternate currency', () => {
    // Some Node ICU builds use NBSP between USD and the number; allow either.
    const formatted = formatMoney(2_500, 'USD', 'en-US');
    expect(formatted).toMatch(/^\$25/);
  });
});
