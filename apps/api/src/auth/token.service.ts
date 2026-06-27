import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { uuidv7 } from 'uuidv7';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';

export type PrincipalKind = 'admin' | 'customer';

export interface AccessTokenPayload {
  sub: string;
  kind: PrincipalKind;
  sid: string;
}

export interface RefreshTokenPayload {
  sub: string;
  kind: PrincipalKind;
  sid: string;
  jti: string;
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
      { sub: subjectId, kind, sid: sessionId } satisfies AccessTokenPayload,
      { secret: this.env.JWT_ACCESS_SECRET, expiresIn: this.env.JWT_ACCESS_TTL_SEC },
    );
    const refresh = await this.jwt.signAsync(
      { sub: subjectId, kind, sid: sessionId, jti } satisfies RefreshTokenPayload,
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
    return this.jwt.verify<AccessTokenPayload>(token, { secret: this.env.JWT_ACCESS_SECRET });
  }

  verifyRefresh(token: string): RefreshTokenPayload {
    return this.jwt.verify<RefreshTokenPayload>(token, { secret: this.env.JWT_REFRESH_SECRET });
  }
}
