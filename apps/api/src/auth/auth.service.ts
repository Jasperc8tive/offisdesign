import { Injectable, UnauthorizedException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService, type IssuedTokens, type PrincipalKind } from './token.service';
import { RefreshTokenStore } from '../redis/refresh-token.store';

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

interface LoginResult extends IssuedTokens {
  principal: { id: string; kind: PrincipalKind };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async loginAdmin(input: LoginInput): Promise<LoginResult> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: input.email },
    });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }
    const ok = await this.passwords.verify(input.password, user.passwordHash);
    if (!ok)
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });

    const sessionId = uuidv7();
    const issued = await this.tokens.issue('admin', user.id, sessionId);
    const expiresAt = new Date(Date.now() + issued.refreshTtlSec * 1000);
    await this.prisma.adminSession.create({
      data: {
        id: sessionId,
        adminUserId: user.id,
        refreshTokenJti: issued.refreshJti,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        expiresAt,
      },
    });
    await this.refreshStore.track(issued.refreshJti, sessionId, issued.refreshTtlSec);
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return { ...issued, principal: { id: user.id, kind: 'admin' } };
  }

  async loginCustomer(input: LoginInput): Promise<LoginResult> {
    const customer = await this.prisma.customer.findUnique({
      where: { email: input.email },
    });
    if (!customer || !customer.passwordHash || customer.deletedAt) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }
    const ok = await this.passwords.verify(input.password, customer.passwordHash);
    if (!ok)
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });

    const sessionId = uuidv7();
    const issued = await this.tokens.issue('customer', customer.id, sessionId);
    const expiresAt = new Date(Date.now() + issued.refreshTtlSec * 1000);
    await this.prisma.customerSession.create({
      data: {
        id: sessionId,
        customerId: customer.id,
        refreshTokenJti: issued.refreshJti,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        expiresAt,
      },
    });
    await this.refreshStore.track(issued.refreshJti, sessionId, issued.refreshTtlSec);
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });
    return { ...issued, principal: { id: customer.id, kind: 'customer' } };
  }

  /**
   * Verify the refresh token, ensure its JTI is still tracked in Redis,
   * rotate to a new JTI, and update the session row.
   */
  async refresh(
    refreshToken: string,
  ): Promise<IssuedTokens & { principal: { id: string; kind: PrincipalKind } }> {
    let payload;
    try {
      payload = this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH',
        message: 'Invalid refresh token',
      });
    }

    const tracked = await this.refreshStore.lookup(payload.jti);
    if (!tracked || tracked !== payload.sid) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH',
        message: 'Refresh token revoked',
      });
    }

    const issued = await this.tokens.issue(payload.kind, payload.sub, payload.sid);
    const expiresAt = new Date(Date.now() + issued.refreshTtlSec * 1000);

    if (payload.kind === 'admin') {
      await this.prisma.adminSession.update({
        where: { id: payload.sid },
        data: { refreshTokenJti: issued.refreshJti, expiresAt },
      });
    } else {
      await this.prisma.customerSession.update({
        where: { id: payload.sid },
        data: { refreshTokenJti: issued.refreshJti, expiresAt },
      });
    }
    await this.refreshStore.rotate(
      payload.jti,
      issued.refreshJti,
      payload.sid,
      issued.refreshTtlSec,
    );
    return { ...issued, principal: { id: payload.sub, kind: payload.kind } };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = this.tokens.verifyRefresh(refreshToken);
      await this.refreshStore.revoke(payload.jti);
      if (payload.kind === 'admin') {
        await this.prisma.adminSession.update({
          where: { id: payload.sid },
          data: { revokedAt: new Date() },
        });
      } else {
        await this.prisma.customerSession.update({
          where: { id: payload.sid },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      // Best-effort: a malformed token still results in clearing client cookies.
    }
  }
}
