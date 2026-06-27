import { Injectable } from '@nestjs/common';
import { Prisma, type ProductStatus } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';
import { type Pagination, buildPage, offset, type Page } from '../common/pagination';

interface ListFilters {
  q?: string;
  status?: ProductStatus;
  collectionSlug?: string;
  categorySlug?: string;
  tagSlug?: string;
  sort: 'recent' | 'name' | 'price-asc' | 'price-desc';
  includeDeleted?: boolean;
  onlyPublished?: boolean;
}

const PRODUCT_INCLUDE = {
  variants: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const } },
  options: { include: { values: { orderBy: { position: 'asc' as const } } } },
  media: { orderBy: { position: 'asc' as const } },
  specifications: { orderBy: { position: 'asc' as const } },
  documents: { orderBy: { position: 'asc' as const } },
  collections: { include: { collection: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  linksFrom: {
    include: {
      to: {
        include: {
          variants: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const }, take: 1 },
        },
      },
    },
    orderBy: { position: 'asc' as const },
  },
} as const;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug }, include: PRODUCT_INCLUDE });
  }

  slugExists(slug: string): Promise<boolean> {
    return this.prisma.product
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  async list(
    filters: ListFilters,
    p: Pagination,
  ): Promise<Page<Awaited<ReturnType<typeof this.prisma.product.findMany>>[number]>> {
    const where: Prisma.ProductWhereInput = {
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
      ...(filters.onlyPublished ? { status: 'ACTIVE', publishedAt: { not: null } } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { slug: { contains: filters.q, mode: 'insensitive' } },
              { description: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.collectionSlug
        ? { collections: { some: { collection: { slug: filters.collectionSlug } } } }
        : {}),
      ...(filters.categorySlug
        ? { categories: { some: { category: { slug: filters.categorySlug } } } }
        : {}),
      ...(filters.tagSlug ? { tags: { some: { tag: { slug: filters.tagSlug } } } } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters.sort === 'name'
        ? { name: 'asc' }
        : filters.sort === 'price-asc' || filters.sort === 'price-desc'
          ? { createdAt: 'desc' } // variant-derived sort is computed post-query (out of scope here)
          : { createdAt: 'desc' };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        include: PRODUCT_INCLUDE,
        skip: offset(p),
        take: p.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    return buildPage(rows, total, p);
  }

  create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data, include: PRODUCT_INCLUDE });
  }

  /**
   * Optimistic update: requires the caller-supplied `version` to match the
   * current row, otherwise the WHERE clause matches zero rows and the
   * underlying `updateMany` returns count 0.
   */
  async update(id: string, expectedVersion: number, data: Prisma.ProductUpdateInput) {
    const res = await this.prisma.product.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    if (res.count === 0) return null;
    return this.findById(id);
  }

  softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** For SearchService — minimal projection used by the indexer. */
  async listForIndex(after?: Date, limit = 500) {
    return this.prisma.product.findMany({
      where: { deletedAt: null, ...(after ? { updatedAt: { gt: after } } : {}) },
      orderBy: { updatedAt: 'asc' },
      take: limit,
      include: {
        variants: {
          where: { deletedAt: null },
          select: { sku: true, priceAmount: true, priceCurrency: true },
        },
        tags: { include: { tag: true } },
        collections: { include: { collection: true } },
        categories: { include: { category: true } },
      },
    });
  }
}
