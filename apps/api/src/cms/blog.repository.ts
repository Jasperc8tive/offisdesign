import { Injectable } from '@nestjs/common';
import { type Prisma, CmsStatus } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';
import { type Page, type Pagination, buildPage, offset } from '../common/pagination';

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPostById(id: string) {
    return this.prisma.blogPost.findUnique({ where: { id }, include: { author: true } });
  }

  findPostBySlug(slug: string) {
    return this.prisma.blogPost.findUnique({ where: { slug }, include: { author: true } });
  }

  postSlugExists(slug: string) {
    return this.prisma.blogPost
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  async listPosts(
    filter: { status?: CmsStatus; q?: string; tag?: string; includeDeleted?: boolean },
    p: Pagination,
  ): Promise<Page<Awaited<ReturnType<typeof this.prisma.blogPost.findMany>>[number]>> {
    const where: Prisma.BlogPostWhereInput = {
      ...(filter.includeDeleted ? {} : { deletedAt: null }),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.tag ? { tags: { has: filter.tag } } : {}),
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q, mode: 'insensitive' } },
              { excerpt: { contains: filter.q, mode: 'insensitive' } },
              { body: { contains: filter.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: { author: true },
        skip: offset(p),
        take: p.pageSize,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return buildPage(rows, total, p);
  }

  createPost(data: Prisma.BlogPostCreateInput) {
    return this.prisma.blogPost.create({ data, include: { author: true } });
  }

  async updatePost(id: string, expectedVersion: number, data: Prisma.BlogPostUpdateInput) {
    const res = await this.prisma.blogPost.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (res.count === 0) return null;
    return this.findPostById(id);
  }

  softDeletePost(id: string) {
    return this.prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findScheduledForPublish(now = new Date()) {
    return this.prisma.blogPost.findMany({
      where: {
        status: CmsStatus.SCHEDULED,
        scheduledAt: { lte: now },
        deletedAt: null,
      },
      take: 100,
    });
  }

  findScheduledForUnpublish(now = new Date()) {
    return this.prisma.blogPost.findMany({
      where: {
        status: CmsStatus.PUBLISHED,
        unscheduledAt: { lte: now },
        deletedAt: null,
      },
      take: 100,
    });
  }

  // Authors
  listAuthors() {
    return this.prisma.author.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  findAuthorById(id: string) {
    return this.prisma.author.findUnique({ where: { id } });
  }

  authorSlugExists(slug: string) {
    return this.prisma.author
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  createAuthor(data: Prisma.AuthorCreateInput) {
    return this.prisma.author.create({ data });
  }

  updateAuthor(id: string, data: Prisma.AuthorUpdateInput) {
    return this.prisma.author.update({ where: { id }, data });
  }

  softDeleteAuthor(id: string) {
    return this.prisma.author.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
