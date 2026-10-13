import { CustomerApplicationService } from './customer.app';

const customer = {
  id: 'c1',
  email: 'ada@example.ng',
  passwordHash: '$2a$12$secret',
  deletedAt: null,
};
const session = {
  id: 's1',
  customerId: 'c1',
  refreshTokenJti: 'jti-secret',
  userAgent: null,
  ipAddress: null,
  expiresAt: new Date(),
  revokedAt: null,
  createdAt: new Date(),
};

function harness() {
  const domain = {
    register: jest.fn(async () => ({ customer, verificationToken: { raw: 't' } })),
    updateProfile: jest.fn(async () => customer),
    changePassword: jest.fn(async () => customer),
    deactivate: jest.fn(async () => ({ ...customer, deletedAt: new Date() })),
  };
  const repo = {
    findById: jest.fn(async () => customer),
    listSessions: jest.fn(async () => [session, { ...session, id: 's2' }]),
  };
  const sessions = { revokeCustomerSession: jest.fn(async () => true) };
  const app = new CustomerApplicationService(
    domain as never,
    repo as never,
    sessions as never,
    { publish: jest.fn() } as never,
    { send: jest.fn() } as never,
    { WEB_PUBLIC_URL: 'http://localhost:3000' } as never,
  );
  return { app, domain, sessions };
}

describe('CustomerApplicationService responses', () => {
  it.each([
    ['register', (a: CustomerApplicationService) => a.register({} as never)],
    ['getProfile', (a: CustomerApplicationService) => a.getProfile('c1')],
    ['updateProfile', (a: CustomerApplicationService) => a.updateProfile('c1', {} as never)],
    ['changePassword', (a: CustomerApplicationService) => a.changePassword('c1', {} as never)],
    ['deactivate', (a: CustomerApplicationService) => a.deactivate('c1')],
  ])('%s never returns the password hash', async (_name, call) => {
    const out = await call(harness().app);
    expect(out).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(out)).not.toContain('$2a$');
  });

  it('lists sessions without refresh-token JTIs and flags the current one', async () => {
    const out = await harness().app.listSessions('c1', 's2');
    expect(JSON.stringify(out)).not.toContain('jti-secret');
    expect(out.map((s) => [s.id, s.isCurrent])).toEqual([
      ['s1', false],
      ['s2', true],
    ]);
  });

  it('passes the current session through so change-password keeps it', async () => {
    const h = harness();
    await h.app.changePassword('c1', {} as never, 's1');
    expect(h.domain.changePassword).toHaveBeenCalledWith('c1', {}, 's1');
  });

  it('revokes a session through the session service', async () => {
    const h = harness();
    expect(await h.app.revokeSession('c1', 's2')).toEqual({ revoked: true });
    expect(h.sessions.revokeCustomerSession).toHaveBeenCalledWith('c1', 's2');
  });
});
