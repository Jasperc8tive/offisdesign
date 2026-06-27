import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  slugExists(slug: string): Promise<boolean> {
    return this.prisma.category
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  listAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  attach(productId: string, categoryId: string) {
    return this.prisma.productCategory.upsert({
      where: { productId_categoryId: { productId, categoryId } },
      update: {},
      create: { productId, categoryId },
    });
  }

  detach(productId: string, categoryId: string) {
    return this.prisma.productCategory.delete({
      where: { productId_categoryId: { productId, categoryId } },
    });
  }
}
