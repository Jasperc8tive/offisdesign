import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { uuidv7 } from 'uuidv7';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';

export type PrincipalKind = 'admin' | 'customer';

/**
 * Token type claim. Tokens issued before it existed have no `typ`; they are
 * still accepted so live sessions survive the rollout, but a token can never
 * be used as the other type.
 */
type TokenType = 'access' | 'refresh';

export interface AccessTokenPayload {
  sub: string;
  kind: PrincipalKind;
  sid: string;
  typ?: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  kind: PrincipalKind;
  sid: string;
  jti: string;
  typ?: 'refresh';
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
  accessTtlSec: number;
  refreshTtlSec: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async issue(kind: PrincipalKind, subjectId: string, sessionId: string): Promise<IssuedTokens> {
    const jti = uuidv7();
    const access = await this.jwt.signAsync(
      { sub: subjectId, kind, sid: sessionId, typ: 'access' } satisfies AccessTokenPayload,
      { secret: this.env.JWT_ACCESS_SECRET, expiresIn: this.env.JWT_ACCESS_TTL_SEC },
    );
    const refresh = await this.jwt.signAsync(
      { sub: subjectId, kind, sid: sessionId, jti, typ: 'refresh' } satisfies RefreshTokenPayload,
      { secret: this.env.JWT_REFRESH_SECRET, expiresIn: this.env.JWT_REFRESH_TTL_SEC },
    );
    return {
      accessToken: access,
      refreshToken: refresh,
      refreshJti: jti,
      accessTtlSec: this.env.JWT_ACCESS_TTL_SEC,
      refreshTtlSec: this.env.JWT_REFRESH_TTL_SEC,
    };
  }

  verifyAccess(token: string): AccessTokenPayload {
    const payload = this.jwt.verify<AccessTokenPayload>(token, {
      secret: this.env.JWT_ACCESS_SECRET,
    });
    assertType(payload, 'access');
    // Legacy refresh tokens have no `typ` but always carry a jti; access
    // tokens never do.
    if ('jti' in payload) throw new Error('Refresh token used as access token');
    return payload;
  }

  verifyRefresh(token: string): RefreshTokenPayload {
    const payload = this.jwt.verify<RefreshTokenPayload>(token, {
      secret: this.env.JWT_REFRESH_SECRET,
    });
    assertType(payload, 'refresh');
    if (!payload.jti) throw new Error('Refresh token has no jti');
    return payload;
  }
}

function assertType(payload: { typ?: string }, expected: TokenType): void {
  if (payload.typ !== undefined && payload.typ !== expected) {
    throw new Error(`Expected a ${expected} token, got ${payload.typ}`);
  }
}
