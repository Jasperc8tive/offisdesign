import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Branch Sofa — 3-Seater')).toBe('branch-sofa-3-seater');
  });
  it('strips diacritics', () => {
    expect(slugify('Café table')).toBe('cafe-table');
  });
  it('trims trailing hyphens', () => {
    expect(slugify('!!hello world!!')).toBe('hello-world');
  });
});

describe('uniqueSlug', () => {
  it('returns the base when unused', async () => {
    const result = await uniqueSlug('Hello', async () => false);
    expect(result).toBe('hello');
  });
  it('appends -2 when base is taken', async () => {
    const taken = new Set(['hello']);
    const result = await uniqueSlug('Hello', async (s) => taken.has(s));
    expect(result).toBe('hello-2');
  });
  it('walks until a free suffix is found', async () => {
    const taken = new Set(['hello', 'hello-2', 'hello-3']);
    const result = await uniqueSlug('Hello', async (s) => taken.has(s));
    expect(result).toBe('hello-4');
  });
});
