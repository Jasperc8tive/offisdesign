import { PrismaClient, type Prisma } from '@prisma/client';

/**
 * Centralised PrismaClient. The Nest PrismaService wraps this; CLI scripts
 * (seed, migrations) call `getPrisma()` directly. One instance per process.
 */
let prismaSingleton: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaSingleton;
}

/**
 * Run a callback inside a Prisma transaction. Thin shim so service code never
 * imports `Prisma.TransactionClient` directly — keeps the dependency surface
 * narrow if we switch to a different ORM in the future.
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  prisma: PrismaClient = getPrisma(),
): Promise<T> {
  return prisma.$transaction((tx) => fn(tx));
}

export async function healthCheck(prisma: PrismaClient = getPrisma()): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export * from '@prisma/client';
