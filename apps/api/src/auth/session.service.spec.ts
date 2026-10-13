import { SessionService } from './session.service';

const future = new Date(Date.now() + 60_000);
const past = new Date(Date.now() - 60_000);

function harness(rows: {
  customer?: Record<string, unknown> | null;
  admin?: Record<string, unknown> | null;
  sessions?: { id: string; refreshTokenJti: string }[];
}) {
  const prisma = {
    customerSession: {
      findUnique: jest.fn(async () => rows.customer ?? null),
      findFirst: jest.fn(
        async (args: { where: { id: string } }) =>
          (rows.sessions ?? []).find((s) => s.id === args.where.id) ?? null,
      ),
      findMany: jest.fn(async (args: { where: { id?: { not: string } } }) =>
        (rows.sessions ?? []).filter((s) => s.id !== args.where.id?.not),
      ),
      update: jest.fn(async () => undefined),
      updateMany: jest.fn(async () => undefined),
    },
    adminSession: { findUnique: jest.fn(async () => rows.admin ?? null) },
  };
  const store = {
    revoke: jest.fn(async () => undefined),
    revokeMany: jest.fn(async () => undefined),
  };
  return { svc: new SessionService(prisma as never, store as never), prisma, store };
}

const liveCustomer = {
  revokedAt: null,
  expiresAt: future,
  refreshTokenJti: 'jti-1',
  customer: { deletedAt: null },
};
const liveAdmin = {
  revokedAt: null,
  expiresAt: future,
  refreshTokenJti: 'jti-a',
  user: { isActive: true, deletedAt: null },
};

describe('SessionService.state', () => {
  it('is active for a live customer session', async () => {
    expect(await harness({ customer: liveCustomer }).svc.state('customer', 'sid')).toEqual({
      active: true,
      currentJti: 'jti-1',
    });
  });

  it.each([
    ['missing', null],
    ['revoked', { ...liveCustomer, revokedAt: past }],
    ['expired', { ...liveCustomer, expiresAt: past }],
    ['deactivated customer', { ...liveCustomer, customer: { deletedAt: past } }],
  ])('is inactive when the customer session is %s', async (_label, row) => {
    expect((await harness({ customer: row }).svc.state('customer', 'sid')).active).toBe(false);
  });

  it.each([
    ['inactive', { ...liveAdmin, user: { isActive: false, deletedAt: null } }],
    ['deleted', { ...liveAdmin, user: { isActive: true, deletedAt: past } }],
  ])('is inactive for an %s admin', async (_label, row) => {
    expect((await harness({ admin: row }).svc.state('admin', 'sid')).active).toBe(false);
  });
});

describe('SessionService revocation', () => {
  const sessions = [
    { id: 's1', refreshTokenJti: 'j1' },
    { id: 's2', refreshTokenJti: 'j2' },
  ];

  it('revokes every other session in Postgres and Redis', async () => {
    const h = harness({ sessions });
    expect(await h.svc.revokeCustomerSessions('c1', { except: 's1' })).toBe(1);
    expect(h.prisma.customerSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: 's1' } }) }),
    );
    expect(h.store.revokeMany).toHaveBeenCalledWith(['j2']);
  });

  it('revokes a single owned session and its refresh token', async () => {
    const h = harness({ sessions });
    expect(await h.svc.revokeCustomerSession('c1', 's2')).toBe(true);
    expect(h.store.revoke).toHaveBeenCalledWith('j2');
    expect(await h.svc.revokeCustomerSession('c1', 'nope')).toBe(false);
  });
});
