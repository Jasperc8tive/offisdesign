import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './json-ld';

describe('serializeJsonLd', () => {
  it('cannot be broken out of with a closing script tag', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(out).toContain('\\u003c/script>');
  });

  it('round-trips to the same data', () => {
    const payload = { '@type': 'Product', name: 'Desk <Pro> & Chair' };
    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });
});
