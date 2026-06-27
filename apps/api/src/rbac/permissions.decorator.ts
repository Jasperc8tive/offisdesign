import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'rbac:permissions';

/**
 * Require ALL the listed permissions on the current principal. Use multiple
 * decorators OR a single call with multiple values — both compose into ALL.
 */
export const RequirePermissions = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);
