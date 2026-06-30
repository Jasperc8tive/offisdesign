import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats minor units as NGN by default', () => {
    // ICU build varies (₦ symbol vs NGN code, optional NBSP); assert the parts.
    const formatted = formatMoney(12_999);
    expect(formatted).toMatch(/₦|NGN/);
    expect(formatted).toContain('129.99');
  });

  it('drops trailing zeros for round amounts', () => {
    const formatted = formatMoney(100_000);
    expect(formatted).toContain('1,000');
    expect(formatted).not.toContain('.00');
  });

  it('supports an alternate currency', () => {
    // Some Node ICU builds use NBSP between USD and the number; allow either.
    const formatted = formatMoney(2_500, 'USD', 'en-US');
    expect(formatted).toMatch(/^\$25/);
  });
});
