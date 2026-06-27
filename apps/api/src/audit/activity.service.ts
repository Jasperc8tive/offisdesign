import { Injectable } from '@nestjs/common';
import type { Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';
import { getContext } from '../common/request-context';

export interface LogInput {
  action: string;
  aggregateType?: string;
  aggregateId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogInput) {
    const ctx = getContext();
    return this.prisma.adminActivityLog.create({
      data: {
        id: uuidv7(),
        action: input.action,
        ...(input.aggregateType ? { aggregateType: input.aggregateType } : {}),
        ...(input.aggregateId ? { aggregateId: input.aggregateId } : {}),
        ...(input.actorId
          ? { actorId: input.actorId }
          : ctx?.principal?.kind === 'admin'
            ? { actorId: ctx.principal.id }
            : {}),
        ...(ctx?.ipAddress ? { ipAddress: ctx.ipAddress } : {}),
        ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
        ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
      },
    });
  }

  list(filter: {
    actorId?: string | undefined;
    aggregateType?: string | undefined;
    aggregateId?: string | undefined;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.AdminActivityLogWhereInput = {
      ...(filter.actorId ? { actorId: filter.actorId } : {}),
      ...(filter.aggregateType ? { aggregateType: filter.aggregateType } : {}),
      ...(filter.aggregateId ? { aggregateId: filter.aggregateId } : {}),
    };
    return Promise.all([
      this.prisma.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.adminActivityLog.count({ where }),
    ]);
  }
}
