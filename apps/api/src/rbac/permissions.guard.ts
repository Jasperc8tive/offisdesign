import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { Principal } from '../auth/principal';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndMerge<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { principal?: Principal }>();
    const principal = req.principal;
    if (!principal) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not authenticated' });
    }
    const owned = new Set(principal.permissions);
    const missing = required.filter((p) => !owned.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Missing permissions: ${missing.join(', ')}`,
      });
    }
    return true;
  }
}
