import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function ctx(token?: string) {
  const req = { cookies: token ? { offis_at: token } : {}, headers: {} } as Record<string, unknown>;
  return {
    req,
    context: { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext,
  };
}

function guard(active: boolean) {
  const tokens = {
    verifyAccess: jest.fn(() => ({ sub: 'c1', kind: 'customer', sid: 's1' })),
  };
  const prisma = { adminUserRole: { findMany: jest.fn(async () => []) } };
  const sessions = { state: jest.fn(async () => ({ active, currentJti: null })) };
  return new JwtAuthGuard(tokens as never, prisma as never, sessions as never);
}

describe('JwtAuthGuard', () => {
  it('admits a valid token whose session is active', async () => {
    const { req, context } = ctx('at');
    await expect(guard(true).canActivate(context)).resolves.toBe(true);
    expect(req.principal).toMatchObject({ id: 'c1', sessionId: 's1' });
  });

  it('rejects a valid token whose session was revoked or account deactivated', async () => {
    await expect(guard(false).canActivate(ctx('at').context)).rejects.toMatchObject({
      response: { code: 'SESSION_REVOKED' },
    });
  });

  it('rejects a request without a token', async () => {
    await expect(guard(true).canActivate(ctx().context)).rejects.toMatchObject({
      response: { code: 'UNAUTHENTICATED' },
    });
  });
});
