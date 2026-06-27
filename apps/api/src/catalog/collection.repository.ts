import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';
import { type Page, type Pagination, buildPage, offset } from '../common/pagination';

@Injectable()
export class CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.collection.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.collection.findUnique({
      where: { slug },
      include: { products: { include: { product: true } } },
    });
  }

  slugExists(slug: string): Promise<boolean> {
    return this.prisma.collection
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  async list(
    p: Pagination,
    includeHidden = false,
  ): Promise<Page<Awaited<ReturnType<typeof this.prisma.collection.findMany>>[number]>> {
    const where: Prisma.CollectionWhereInput = {
      deletedAt: null,
      ...(includeHidden ? {} : { isVisible: true }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.collection.findMany({
        where,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip: offset(p),
        take: p.pageSize,
      }),
      this.prisma.collection.count({ where }),
    ]);
    return buildPage(rows, total, p);
  }

  create(data: Prisma.CollectionCreateInput) {
    return this.prisma.collection.create({ data });
  }

  update(id: string, data: Prisma.CollectionUpdateInput) {
    return this.prisma.collection.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  attach(productId: string, collectionId: string, position = 0) {
    return this.prisma.productCollection.upsert({
      where: { productId_collectionId: { productId, collectionId } },
      update: { position },
      create: { productId, collectionId, position },
    });
  }

  detach(productId: string, collectionId: string) {
    return this.prisma.productCollection.delete({
      where: { productId_collectionId: { productId, collectionId } },
    });
  }
}
