import { describe, expect, it } from 'vitest';
import { findBlock, findBlocks, str, type Block } from './cms-block';

const blocks: Block[] = [
  { id: '1', kind: 'hero', position: 0, payload: { title: 'Hello' } },
  { id: '2', kind: 'promo_banner', position: 1, payload: { eyebrow: 'Sale' } },
  { id: '3', kind: 'promo_banner', position: 2, payload: { eyebrow: 'Bonus' } },
];

describe('CMS block helpers', () => {
  it('findBlock returns the first matching payload', () => {
    expect(findBlock<{ title: string }>(blocks, 'hero')).toEqual({ title: 'Hello' });
  });

  it('findBlock returns undefined when no match', () => {
    expect(findBlock(blocks, 'missing')).toBeUndefined();
  });

  it('findBlocks returns every matching payload in order', () => {
    expect(findBlocks(blocks, 'promo_banner')).toEqual([{ eyebrow: 'Sale' }, { eyebrow: 'Bonus' }]);
  });

  it('str returns the string at a key or undefined', () => {
    expect(str({ a: 'x', b: 42 }, 'a')).toBe('x');
    expect(str({ a: 'x' }, 'b')).toBeUndefined();
    expect(str(null, 'a')).toBeUndefined();
  });
});
