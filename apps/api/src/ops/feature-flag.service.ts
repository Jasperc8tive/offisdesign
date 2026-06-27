import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

export const featureFlagInputSchema = z.object({
  key: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  enabled: z.boolean().default(false),
  rolloutPct: z.number().int().min(0).max(100).default(0),
  config: z.record(z.unknown()).optional(),
});
export type FeatureFlagInput = z.infer<typeof featureFlagInputSchema>;
export const featureFlagPatchSchema = featureFlagInputSchema.partial();
export type FeatureFlagPatch = z.infer<typeof featureFlagPatchSchema>;

@Injectable()
export class FeatureFlagService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  findByKey(key: string) {
    return this.prisma.featureFlag.findUnique({ where: { key } });
  }

  async create(input: FeatureFlagInput) {
    if (await this.prisma.featureFlag.findUnique({ where: { key: input.key } })) {
      throw new ConflictException({ code: 'KEY_TAKEN' });
    }
    return this.prisma.featureFlag.create({
      data: {
        id: uuidv7(),
        key: input.key,
        name: input.name,
        ...(input.description ? { description: input.description } : {}),
        enabled: input.enabled,
        rolloutPct: input.rolloutPct,
        ...(input.config ? { config: input.config as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async update(id: string, input: FeatureFlagPatch) {
    const existing = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    return this.prisma.featureFlag.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.rolloutPct !== undefined ? { rolloutPct: input.rolloutPct } : {}),
        ...(input.config !== undefined ? { config: input.config as Prisma.InputJsonValue } : {}),
      },
    });
  }

  delete(id: string) {
    return this.prisma.featureFlag.delete({ where: { id } });
  }

  /**
   * Evaluate a feature flag for a given subject id. Determinism:
   * - `enabled === false` → always off.
   * - No subject (anonymous, unknown) → on iff `rolloutPct >= 100`.
   * - Otherwise → hash `flagKey:subject` to a 0–99 bucket; on iff bucket < rolloutPct.
   */
  async isEnabled(key: string, subjectId?: string): Promise<boolean> {
    const flag = await this.findByKey(key);
    if (!flag || !flag.enabled) return false;
    if (flag.rolloutPct >= 100) return true;
    if (flag.rolloutPct <= 0) return false;
    if (!subjectId) return false;
    return bucketFor(key, subjectId) < flag.rolloutPct;
  }
}

/** Deterministic 0–99 bucket from `key + subjectId`. */
export function bucketFor(key: string, subjectId: string): number {
  const digest = createHash('sha256').update(`${key}:${subjectId}`).digest();
  // Use the first 4 bytes as an unsigned int, mod 100.
  const bytes = digest.subarray(0, 4);
  const n = (bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!;
  return Math.abs(n) % 100;
}
