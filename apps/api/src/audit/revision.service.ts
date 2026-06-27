import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';

interface RecordInput {
  aggregateType: string;
  aggregateId: string;
  snapshot: object;
  actorId?: string | undefined;
  reason?: string | undefined;
}

/**
 * Generic revision service. Any aggregate that opts in calls `record()` after
 * a successful write. The service assigns a monotonic version per
 * (aggregateType, aggregateId) using a single atomic SELECT + INSERT inside a
 * transaction, then computes a shallow diff against the previous snapshot.
 */
@Injectable()
export class RevisionService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordInput) {
    return this.prisma.$transaction(async (tx) => {
      const previous = await tx.contentRevision.findFirst({
        where: { aggregateType: input.aggregateType, aggregateId: input.aggregateId },
        orderBy: { version: 'desc' },
      });
      const version = (previous?.version ?? 0) + 1;
      const diff = previous ? shallowDiff(previous.snapshot as object, input.snapshot) : null;
      return tx.contentRevision.create({
        data: {
          id: uuidv7(),
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          version,
          snapshot: input.snapshot as Prisma.InputJsonValue,
          ...(diff ? { diff: diff as Prisma.InputJsonValue } : {}),
          ...(input.actorId ? { actorId: input.actorId } : {}),
          ...(input.reason ? { reason: input.reason } : {}),
        },
      });
    });
  }

  list(aggregateType: string, aggregateId: string) {
    return this.prisma.contentRevision.findMany({
      where: { aggregateType, aggregateId },
      orderBy: { version: 'desc' },
    });
  }

  async getOrThrow(aggregateType: string, aggregateId: string, version: number) {
    const row = await this.prisma.contentRevision.findUnique({
      where: {
        aggregateType_aggregateId_version: { aggregateType, aggregateId, version },
      },
    });
    if (!row) throw new NotFoundException();
    return row;
  }
}

/**
 * Shallow object diff — `{ key: { from, to } }` for changed scalar fields.
 * Nested values are compared by JSON equality. Adequate for CMS revision UI;
 * deep semantic diffs are an editor concern, not a backend one.
 */
function shallowDiff(prev: object, next: object): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  const p = prev as Record<string, unknown>;
  const n = next as Record<string, unknown>;
  const keys = new Set([...Object.keys(p), ...Object.keys(n)]);
  for (const key of keys) {
    if (JSON.stringify(p[key]) !== JSON.stringify(n[key])) {
      out[key] = { from: p[key] ?? null, to: n[key] ?? null };
    }
  }
  return out;
}
