import { generateOrderNumber } from './order-number';

describe('order number', () => {
  it('matches the OD-YYYYMM-XXXXXXX format', () => {
    const num = generateOrderNumber(new Date('2026-03-15T00:00:00Z'));
    expect(num).toMatch(/^OD-202603-[0-9A-HJKMNPQRSTVWXYZ]{7}$/);
  });

  it('produces unique numbers across calls', () => {
    const numbers = new Set(Array.from({ length: 100 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(100);
  });
});
