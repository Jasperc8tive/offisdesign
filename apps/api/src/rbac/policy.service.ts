import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Principal } from '../auth/principal';

/**
 * Programmatic policy layer for resource-level decisions that don't fit a
 * static @RequirePermissions decoration — e.g. "this customer may only read
 * their own orders". Feature modules call these helpers from services.
 */
@Injectable()
export class PolicyService {
  /** Throw FORBIDDEN unless the principal owns the resource. */
  assertOwns(principal: Principal | undefined, ownerId: string | null | undefined): void {
    if (!principal)
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not authenticated' });
    if (!ownerId || principal.id !== ownerId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Resource not owned by principal',
      });
    }
  }

  /** True if principal has any of the listed permissions. */
  hasAny(principal: Principal | undefined, perms: string[]): boolean {
    if (!principal) return false;
    const owned = new Set(principal.permissions);
    return perms.some((p) => owned.has(p));
  }

  /** True if principal has all listed permissions. */
  hasAll(principal: Principal | undefined, perms: string[]): boolean {
    if (!principal) return false;
    const owned = new Set(principal.permissions);
    return perms.every((p) => owned.has(p));
  }
}
