import { bucketFor } from './feature-flag.service';

describe('bucketFor', () => {
  it('is deterministic for the same input', () => {
    const a = bucketFor('flag.a', 'user-1');
    const b = bucketFor('flag.a', 'user-1');
    expect(a).toBe(b);
  });

  it('differs by subject', () => {
    const a = bucketFor('flag.a', 'user-1');
    const b = bucketFor('flag.a', 'user-2');
    expect(a).not.toBe(b);
  });

  it('differs by key for the same subject', () => {
    const a = bucketFor('flag.a', 'user-1');
    const b = bucketFor('flag.b', 'user-1');
    expect(a).not.toBe(b);
  });

  it('produces a roughly uniform distribution', () => {
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 10_000; i++) {
      buckets[Math.floor(bucketFor('flag', `s${i}`) / 10)]++;
    }
    for (const count of buckets) {
      // Each decile (~1000 items) should land between 800–1200 — generous
      // bounds so this test isn't flaky on a fixed hash function.
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });
});
