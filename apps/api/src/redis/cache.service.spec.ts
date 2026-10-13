import { CacheService } from './cache.service';

function fakeRedis(keys: string[]) {
  const store = new Set(keys);
  let matches: string[] = [];
  const client = {
    // Two-page SCAN over a snapshot taken at cursor 0, so batching is exercised.
    scan: jest.fn(async (cursor: string, _m: string, pattern: string) => {
      if (cursor === '0') matches = [...store].filter((k) => k.startsWith(pattern.slice(0, -1)));
      const half = Math.ceil(matches.length / 2);
      return cursor === '0' ? ['1', matches.slice(0, half)] : ['0', matches.slice(half)];
    }),
    unlink: jest.fn(async (...ks: string[]) => ks.filter((k) => store.delete(k)).length),
  };
  return { store, svc: new CacheService({ client } as never) };
}

describe('CacheService.deleteByPrefix', () => {
  it('only removes keys in the given namespace', async () => {
    const { store, svc } = fakeRedis([
      'cat:product:slug:a',
      'cat:product:slug:b',
      'cat:category:tree',
      'cms:page:slug:home',
      'auth:refresh:jti-1',
      'offis:bull:email:1',
    ]);
    expect(await svc.deleteByPrefix('cat:')).toBe(3);
    expect([...store].sort()).toEqual([
      'auth:refresh:jti-1',
      'cms:page:slug:home',
      'offis:bull:email:1',
    ]);
  });

  it('refuses an empty prefix (which would match sessions and queues)', async () => {
    await expect(fakeRedis([]).svc.deleteByPrefix('')).rejects.toThrow();
  });
});
