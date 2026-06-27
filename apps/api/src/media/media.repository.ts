import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';
import { type Page, type Pagination, buildPage, offset } from '../common/pagination';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Folders
  listFolders() {
    return this.prisma.mediaFolder.findMany({
      where: { deletedAt: null },
      orderBy: { path: 'asc' },
    });
  }

  findFolderById(id: string) {
    return this.prisma.mediaFolder.findUnique({ where: { id } });
  }

  findFolderByPath(path: string) {
    return this.prisma.mediaFolder.findUnique({ where: { path } });
  }

  createFolder(data: Prisma.MediaFolderCreateInput) {
    return this.prisma.mediaFolder.create({ data });
  }

  updateFolder(id: string, data: Prisma.MediaFolderUpdateInput) {
    return this.prisma.mediaFolder.update({ where: { id }, data });
  }

  softDeleteFolder(id: string) {
    return this.prisma.mediaFolder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Media items
  findById(id: string) {
    return this.prisma.media.findUnique({ where: { id } });
  }

  storageKeyExists(storageKey: string) {
    return this.prisma.media
      .findUnique({ where: { storageKey }, select: { id: true } })
      .then((r) => r != null);
  }

  async list(
    filter: { folderId?: string | null; q?: string; includeDeleted?: boolean },
    p: Pagination,
  ): Promise<Page<Awaited<ReturnType<typeof this.prisma.media.findMany>>[number]>> {
    const where: Prisma.MediaWhereInput = {
      ...(filter.includeDeleted ? {} : { deletedAt: null }),
      ...(filter.folderId !== undefined
        ? filter.folderId === null
          ? { folderId: null }
          : { folderId: filter.folderId }
        : {}),
      ...(filter.q
        ? {
            OR: [
              { filename: { contains: filter.q, mode: 'insensitive' } },
              { alt: { contains: filter.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset(p),
        take: p.pageSize,
      }),
      this.prisma.media.count({ where }),
    ]);
    return buildPage(rows, total, p);
  }

  create(data: Prisma.MediaCreateInput) {
    return this.prisma.media.create({ data });
  }

  update(id: string, data: Prisma.MediaUpdateInput) {
    return this.prisma.media.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Hard-delete soft-deleted items older than the cutoff. Used by media-cleanup cron. */
  findDeletedBefore(cutoff: Date, limit = 200) {
    return this.prisma.media.findMany({
      where: { deletedAt: { lt: cutoff } },
      take: limit,
    });
  }

  hardDelete(id: string) {
    return this.prisma.media.delete({ where: { id } });
  }
}
