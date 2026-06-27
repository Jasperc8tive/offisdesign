import { describe, expect, it } from 'vitest';
import { cn } from './index';

describe('cn', () => {
  it('joins truthy classnames with spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });
  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
  it('returns empty string when all falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
