/**
 * Idempotent seed: RBAC permissions + roles + system super-admin.
 *
 * Run via `pnpm --filter @offisdesign/database db:seed`. Re-runnable safely —
 * uses upserts keyed on stable `key` columns. No business data is seeded.
 */
import bcrypt from 'bcryptjs';
import { uuidv7 } from 'uuidv7';
import { getPrisma } from './index.js';

const prisma = getPrisma();

const PERMISSIONS = [
  // Catalogue
  'catalog:read',
  'catalog:write',
  // Inventory
  'inventory:read',
  'inventory:write',
  // Orders
  'order:read',
  'order:write',
  'order:refund',
  // Customers
  'customer:read',
  'customer:write',
  // CMS
  'cms:read',
  'cms:write',
  'cms:publish',
  // Admin & RBAC
  'admin:read',
  'admin:write',
  'rbac:manage',
  // System
  'system:read',
  'system:audit',
] as const;

const ROLES: Array<{
  key: string;
  name: string;
  description: string;
  permissions: 'all' | readonly string[];
}> = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Full access. One human only — used for break-glass operations.',
    permissions: 'all',
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'Full operational access except RBAC management.',
    permissions: PERMISSIONS.filter((p) => p !== 'rbac:manage'),
  },
  {
    key: 'staff',
    name: 'Staff',
    description: 'Catalogue, inventory, orders, customers — no admin or CMS publish.',
    permissions: [
      'catalog:read',
      'catalog:write',
      'inventory:read',
      'inventory:write',
      'order:read',
      'order:write',
      'customer:read',
      'cms:read',
      'cms:write',
      'system:read',
    ],
  },
  {
    key: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to operational data.',
    permissions: [
      'catalog:read',
      'inventory:read',
      'order:read',
      'customer:read',
      'cms:read',
      'system:read',
    ],
  },
];

async function seedPermissions() {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { id: uuidv7(), key },
    });
  }
}

async function seedRoles() {
  for (const role of ROLES) {
    const upserted = await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, description: role.description, isSystem: true },
      create: {
        id: uuidv7(),
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });
    const desired = role.permissions === 'all' ? PERMISSIONS.slice() : role.permissions.slice();
    const perms = await prisma.permission.findMany({ where: { key: { in: desired } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: upserted.id } });
    if (perms.length > 0) {
      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: upserted.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@offisdesign.local';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'change-me-immediately';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      id: uuidv7(),
      email,
      passwordHash,
      displayName: 'Super Admin',
    },
  });

  const role = await prisma.role.findUnique({ where: { key: 'super_admin' } });
  if (!role) throw new Error('super_admin role missing — run roles first');
  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: user.id, roleId: role.id } },
    update: {},
    create: { adminUserId: user.id, roleId: role.id },
  });

  return { email, generatedPassword: password };
}

async function main() {
  await seedPermissions();
  await seedRoles();
  const sa = await seedSuperAdmin();
  console.log(`Seed complete. Super admin: ${sa.email}`);
  if (!process.env.SEED_SUPER_ADMIN_PASSWORD) {
    console.warn(
      `Default super-admin password used. Change it immediately. (set SEED_SUPER_ADMIN_PASSWORD to override)`,
    );
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
