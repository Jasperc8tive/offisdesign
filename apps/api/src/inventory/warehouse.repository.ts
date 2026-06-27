import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.warehouse.findMany({ orderBy: { code: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.warehouse.findUnique({ where: { id } });
  }

  codeExists(code: string): Promise<boolean> {
    return this.prisma.warehouse
      .findUnique({ where: { code }, select: { id: true } })
      .then((r) => r != null);
  }

  create(data: Prisma.WarehouseCreateInput) {
    return this.prisma.warehouse.create({ data });
  }

  update(id: string, data: Prisma.WarehouseUpdateInput) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.warehouse.delete({ where: { id } });
  }
}
