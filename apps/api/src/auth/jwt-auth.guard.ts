import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from './token.service';
import { ACCESS_COOKIE } from './cookie.helper';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
import { getContext } from '../common/request-context';
import type { Principal } from './principal';

function extractToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (fromCookie) return fromCookie;
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
  return undefined;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token)
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'No access token' });

    let payload;
    try {
      payload = this.tokens.verifyAccess(token);
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Invalid access token' });
    }

    // Revocation (logout elsewhere, password change, deactivation) takes
    // effect immediately rather than at access-token expiry.
    const state = await this.sessions.state(payload.kind, payload.sid);
    if (!state.active) {
      throw new UnauthorizedException({
        code: 'SESSION_REVOKED',
        message: 'Session is no longer active',
      });
    }

    let roles: string[] = [];
    let permissions: string[] = [];

    if (payload.kind === 'admin') {
      // Look up active admin + their RBAC.
      const userRoles = await this.prisma.adminUserRole.findMany({
        where: { adminUserId: payload.sub },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      });
      roles = userRoles.map((ur) => ur.role.key);
      permissions = Array.from(
        new Set(userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
      );
    }

    const principal: Principal = {
      kind: payload.kind,
      id: payload.sub,
      sessionId: payload.sid,
      roles,
      permissions,
    };

    (req as Request & { principal: Principal }).principal = principal;
    const ctxStore = getContext();
    if (ctxStore) ctxStore.principal = { ...principal };
    return true;
  }
}
