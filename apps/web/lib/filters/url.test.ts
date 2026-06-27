import { describe, expect, it } from 'vitest';
import { isActive, parseFilters, serializeFilters, toggleArrayFilter } from './url';

describe('discovery filter URL helpers', () => {
  it('round-trips a filter set through serialize/parse', () => {
    const filters = {
      q: 'oak',
      collection: ['sofas', 'lighting'],
      tag: ['workspace'],
      priceMin: 50_000,
      sort: 'price-asc' as const,
      page: 2,
    };
    const params = serializeFilters(filters);
    const parsed = parseFilters(params);
    expect(parsed).toEqual(filters);
  });

  it('omits absent and zero-valued fields from the URL', () => {
    const params = serializeFilters({ q: 'oak', page: 1 });
    expect(params.toString()).toBe('q=oak');
  });

  it('toggleArrayFilter adds when missing, removes when present', () => {
    const initial = { collection: ['a'] };
    const added = toggleArrayFilter(initial, 'collection', 'b');
    expect(added.collection).toEqual(['a', 'b']);
    const removed = toggleArrayFilter(added, 'collection', 'a');
    expect(removed.collection).toEqual(['b']);
  });

  it('toggleArrayFilter clears the page so pagination resets', () => {
    const next = toggleArrayFilter({ collection: [], page: 3 }, 'collection', 'a');
    expect(next.page).toBeUndefined();
  });

  it('isActive reflects whether any filter is set', () => {
    expect(isActive({})).toBe(false);
    expect(isActive({ sort: 'recent' })).toBe(false); // sort alone is not an active filter
    expect(isActive({ q: 'oak' })).toBe(true);
    expect(isActive({ collection: ['x'] })).toBe(true);
    expect(isActive({ priceMin: 1000 })).toBe(true);
  });

  it('ignores malformed numeric and sort values', () => {
    const params = new URLSearchParams('priceMin=NaN&priceMax=-1&sort=garbage&page=abc');
    const parsed = parseFilters(params);
    expect(parsed.priceMin).toBeUndefined();
    expect(parsed.priceMax).toBeUndefined();
    expect(parsed.sort).toBeUndefined();
    expect(parsed.page).toBeUndefined();
  });
});
