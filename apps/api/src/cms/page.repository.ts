import { Injectable } from '@nestjs/common';
import { type Prisma, CmsStatus } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';
import { type Page, type Pagination, buildPage, offset } from '../common/pagination';

const WITH_BLOCKS = {
  blocks: { orderBy: { position: 'asc' as const } },
} as const;

@Injectable()
export class PageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.cmsPage.findUnique({ where: { id }, include: WITH_BLOCKS });
  }

  findBySlug(slug: string) {
    return this.prisma.cmsPage.findUnique({ where: { slug }, include: WITH_BLOCKS });
  }

  slugExists(slug: string) {
    return this.prisma.cmsPage
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  async list(
    filter: { status?: CmsStatus; q?: string; includeDeleted?: boolean },
    p: Pagination,
  ): Promise<Page<Awaited<ReturnType<typeof this.prisma.cmsPage.findMany>>[number]>> {
    const where: Prisma.CmsPageWhereInput = {
      ...(filter.includeDeleted ? {} : { deletedAt: null }),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q, mode: 'insensitive' } },
              { slug: { contains: filter.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cmsPage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: WITH_BLOCKS,
        skip: offset(p),
        take: p.pageSize,
      }),
      this.prisma.cmsPage.count({ where }),
    ]);
    return buildPage(rows, total, p);
  }

  create(data: Prisma.CmsPageCreateInput) {
    return this.prisma.cmsPage.create({ data, include: WITH_BLOCKS });
  }

  /** Optimistic update — returns null on stale version. */
  async update(id: string, expectedVersion: number, data: Prisma.CmsPageUpdateInput) {
    const res = await this.prisma.cmsPage.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (res.count === 0) return null;
    return this.findById(id);
  }

  softDelete(id: string) {
    return this.prisma.cmsPage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Scheduling ────────────────────────────────────────────────────────

  findScheduledForPublish(now = new Date()) {
    return this.prisma.cmsPage.findMany({
      where: {
        status: CmsStatus.SCHEDULED,
        scheduledAt: { lte: now },
        deletedAt: null,
      },
      take: 100,
    });
  }

  findScheduledForUnpublish(now = new Date()) {
    return this.prisma.cmsPage.findMany({
      where: {
        status: CmsStatus.PUBLISHED,
        unscheduledAt: { lte: now },
        deletedAt: null,
      },
      take: 100,
    });
  }

  // ── Blocks ────────────────────────────────────────────────────────────

  createBlock(input: {
    id: string;
    pageId: string;
    kind: string;
    position: number;
    payload: Prisma.InputJsonValue;
  }) {
    return this.prisma.cmsBlock.create({ data: input });
  }

  updateBlock(id: string, data: Prisma.CmsBlockUpdateInput) {
    return this.prisma.cmsBlock.update({ where: { id }, data });
  }

  deleteBlock(id: string) {
    return this.prisma.cmsBlock.delete({ where: { id } });
  }

  reorderBlocks(updates: Array<{ id: string; position: number }>) {
    return this.prisma.$transaction(
      updates.map((u) =>
        this.prisma.cmsBlock.update({ where: { id: u.id }, data: { position: u.position } }),
      ),
    );
  }
}
