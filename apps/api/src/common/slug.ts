import { PrismaClient } from '@offisdesign/database';

const RX = /[^a-z0-9]+/g;

/** Slugify a string: lowercase, hyphenated, alphanumeric only. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(RX, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

interface UniqueChecker {
  (slug: string): Promise<boolean>;
}

/**
 * Iterate slug-1, slug-2, ... until `taken` returns false.
 * Caller supplies the "already taken" check so this stays storage-agnostic.
 */
export async function uniqueSlug(base: string, taken: UniqueChecker): Promise<string> {
  const root = slugify(base) || 'item';
  if (!(await taken(root))) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    if (!(await taken(candidate))) return candidate;
  }
  throw new Error('Could not allocate a unique slug after 1000 attempts');
}

/** Convenience for Product slugs. */
export function productSlugChecker(prisma: PrismaClient) {
  return async (slug: string): Promise<boolean> => {
    const row = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    return row != null;
  };
}
