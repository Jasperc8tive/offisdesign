import { AuthService } from './auth.service';
import type { SessionState } from './session.service';

/** In-memory stand-ins for Redis (refresh JTIs), sessions and token signing. */
function harness(state: SessionState = { active: true, currentJti: 'jti-1' }) {
  const redis = new Map<string, string>([['jti-1', 'sid-1']]);
  const refreshStore = {
    claim: jest.fn(async (jti: string) => {
      const v = redis.get(jti) ?? null;
      redis.delete(jti);
      return v;
    }),
    track: jest.fn(async (jti: string, sid: string) => void redis.set(jti, sid)),
  };
  const sessions = { state: jest.fn(async () => state) };
  let seq = 1;
  const tokens = {
    verifyRefresh: jest.fn((t: string) => {
      if (t !== 'rt-1') throw new Error('bad signature');
      return { sub: 'cust-1', kind: 'customer' as const, sid: 'sid-1', jti: 'jti-1' };
    }),
    issue: jest.fn(async () => ({
      accessToken: 'at',
      refreshToken: 'rt',
      refreshJti: `jti-${++seq}`,
      accessTtlSec: 900,
      refreshTtlSec: 3600,
    })),
  };
  const prisma = {
    customerSession: { update: jest.fn(async () => undefined) },
    adminSession: { update: jest.fn(async () => undefined) },
  };
  const auth = new AuthService(
    prisma as never,
    {} as never,
    tokens as never,
    refreshStore as never,
    sessions as never,
  );
  return { auth, redis, prisma, sessions };
}

describe('AuthService.refresh', () => {
  it('rotates the refresh token on the happy path', async () => {
    const h = harness();
    const out = await h.auth.refresh('rt-1');
    expect(out.principal).toEqual({ id: 'cust-1', kind: 'customer' });
    expect(h.redis.has('jti-1')).toBe(false);
    expect(h.redis.get('jti-2')).toBe('sid-1');
    expect(h.prisma.customerSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ refreshTokenJti: 'jti-2' }) }),
    );
  });

  it('lets exactly one of two concurrent refreshes with the same token win', async () => {
    const h = harness();
    const results = await Promise.allSettled([h.auth.refresh('rt-1'), h.auth.refresh('rt-1')]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });

  it('rejects a bad signature', async () => {
    await expect(harness().auth.refresh('forged')).rejects.toMatchObject({
      response: { code: 'INVALID_REFRESH' },
    });
  });

  it('rejects a JTI that was revoked from Redis', async () => {
    const h = harness();
    h.redis.clear();
    await expect(h.auth.refresh('rt-1')).rejects.toMatchObject({
      response: { code: 'INVALID_REFRESH' },
    });
  });

  it.each([
    ['revoked, expired or deactivated', { active: false, currentJti: null }],
    ['superseded by a newer refresh', { active: true, currentJti: 'jti-9' }],
  ])('rejects a session that is %s', async (_label, state) => {
    const h = harness(state);
    await expect(h.auth.refresh('rt-1')).rejects.toMatchObject({
      response: { code: 'SESSION_REVOKED' },
    });
    // The JTI is consumed either way, so it can't be retried.
    expect(h.redis.has('jti-1')).toBe(false);
  });
});
