import { classifyAvailability } from './storefront-inventory.controller';

describe('classifyAvailability', () => {
  it.each([
    [-3, 'out_of_stock'],
    [0, 'out_of_stock'],
    [1, 'low_stock'],
    [5, 'low_stock'],
    [6, 'in_stock'],
    [9999, 'in_stock'],
  ] as const)('classifies %i as %s', (available, expected) => {
    expect(classifyAvailability(available)).toBe(expected);
  });
});
