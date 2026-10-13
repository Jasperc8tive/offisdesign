import { JwtService } from '@nestjs/jwt';
import type { ApiEnv } from '@offisdesign/config';
import { TokenService } from './token.service';

const SAME = 'same-secret-same-secret-same-secret-1234';
const jwt = new JwtService({});
const svc = new TokenService(jwt, {
  JWT_ACCESS_SECRET: SAME,
  JWT_REFRESH_SECRET: SAME,
  JWT_ACCESS_TTL_SEC: 900,
  JWT_REFRESH_TTL_SEC: 3600,
} as ApiEnv);

describe('TokenService', () => {
  it('never accepts a refresh token as an access token, even with equal secrets', async () => {
    const { refreshToken } = await svc.issue('customer', 'c1', 's1');
    expect(() => svc.verifyAccess(refreshToken)).toThrow();
  });

  it('never accepts an access token as a refresh token', async () => {
    const { accessToken } = await svc.issue('customer', 'c1', 's1');
    expect(() => svc.verifyRefresh(accessToken)).toThrow();
  });

  it('verifies freshly issued tokens', async () => {
    const t = await svc.issue('admin', 'a1', 's1');
    expect(svc.verifyAccess(t.accessToken)).toMatchObject({ sub: 'a1', kind: 'admin', sid: 's1' });
    expect(svc.verifyRefresh(t.refreshToken)).toMatchObject({ jti: t.refreshJti });
  });

  it('still accepts legacy tokens without a typ claim, but not a legacy refresh as access', () => {
    const legacyAccess = jwt.sign({ sub: 'c1', kind: 'customer', sid: 's1' }, { secret: SAME });
    const legacyRefresh = jwt.sign(
      { sub: 'c1', kind: 'customer', sid: 's1', jti: 'j1' },
      { secret: SAME },
    );
    expect(svc.verifyAccess(legacyAccess)).toMatchObject({ sub: 'c1' });
    expect(svc.verifyRefresh(legacyRefresh)).toMatchObject({ jti: 'j1' });
    expect(() => svc.verifyAccess(legacyRefresh)).toThrow();
  });
});
