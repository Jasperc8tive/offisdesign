import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  findBySlug(slug: string) {
    return this.prisma.tag.findUnique({ where: { slug } });
  }

  slugExists(slug: string): Promise<boolean> {
    return this.prisma.tag
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => r != null);
  }

  create(data: Prisma.TagCreateInput) {
    return this.prisma.tag.create({ data });
  }

  update(id: string, data: Prisma.TagUpdateInput) {
    return this.prisma.tag.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }
}
