import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenStore } from '../redis/refresh-token.store';
import type { PrincipalKind } from './token.service';

export interface SessionState {
  /** Session exists, is not revoked or expired, and its account is active. */
  active: boolean;
  /** JTI of the refresh token this session currently accepts. */
  currentJti: string | null;
}

const INACTIVE: SessionState = { active: false, currentJti: null };

/**
 * Single source of truth for "is this session still allowed", used by both
 * the access-token guard and refresh, and the only place sessions are revoked.
 * Revoking always clears the refresh JTI from Redis as well as stamping
 * `revokedAt`, so a revoked session can neither refresh nor authenticate.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async state(kind: PrincipalKind, sessionId: string, now = new Date()): Promise<SessionState> {
    if (kind === 'admin') {
      const s = await this.prisma.adminSession.findUnique({
        where: { id: sessionId },
        select: {
          revokedAt: true,
          expiresAt: true,
          refreshTokenJti: true,
          user: { select: { isActive: true, deletedAt: true } },
        },
      });
      if (!s || s.revokedAt || s.expiresAt <= now || !s.user.isActive || s.user.deletedAt) {
        return INACTIVE;
      }
      return { active: true, currentJti: s.refreshTokenJti };
    }
    const s = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      select: {
        revokedAt: true,
        expiresAt: true,
        refreshTokenJti: true,
        customer: { select: { deletedAt: true } },
      },
    });
    if (!s || s.revokedAt || s.expiresAt <= now || s.customer.deletedAt) return INACTIVE;
    return { active: true, currentJti: s.refreshTokenJti };
  }

  /** Revoke one of a customer's sessions. Returns false if it isn't theirs. */
  async revokeCustomerSession(customerId: string, sessionId: string): Promise<boolean> {
    const session = await this.prisma.customerSession.findFirst({
      where: { id: sessionId, customerId, revokedAt: null },
      select: { id: true, refreshTokenJti: true },
    });
    if (!session) return false;
    await this.prisma.customerSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    await this.refreshStore.revoke(session.refreshTokenJti);
    return true;
  }

  /** Revoke all of a customer's live sessions, optionally keeping one. */
  async revokeCustomerSessions(customerId: string, opts: { except?: string } = {}) {
    const where = {
      customerId,
      revokedAt: null,
      ...(opts.except ? { id: { not: opts.except } } : {}),
    };
    const sessions = await this.prisma.customerSession.findMany({
      where,
      select: { refreshTokenJti: true },
    });
    await this.prisma.customerSession.updateMany({ where, data: { revokedAt: new Date() } });
    await this.refreshStore.revokeMany(sessions.map((s) => s.refreshTokenJti));
    return sessions.length;
  }

  /** Revoke all of an admin user's live sessions, optionally keeping one. */
  async revokeAdminSessions(adminUserId: string, opts: { except?: string } = {}) {
    const where = {
      adminUserId,
      revokedAt: null,
      ...(opts.except ? { id: { not: opts.except } } : {}),
    };
    const sessions = await this.prisma.adminSession.findMany({
      where,
      select: { refreshTokenJti: true },
    });
    await this.prisma.adminSession.updateMany({ where, data: { revokedAt: new Date() } });
    await this.refreshStore.revokeMany(sessions.map((s) => s.refreshTokenJti));
    return sessions.length;
  }
}
