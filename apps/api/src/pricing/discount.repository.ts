import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.discount.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.discount.findUnique({ where: { id } });
  }

  findByCode(code: string) {
    return this.prisma.discount.findUnique({ where: { code } });
  }

  /**
   * All currently-active discounts (auto-applied + by-code). Time window
   * filtering is enforced here so the engine never needs to re-check.
   */
  async findActive(now = new Date()) {
    return this.prisma.discount.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    });
  }

  create(data: Prisma.DiscountCreateInput) {
    return this.prisma.discount.create({ data });
  }

  update(id: string, data: Prisma.DiscountUpdateInput) {
    return this.prisma.discount.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.discount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  recordUsage(input: {
    id: string;
    discountId: string;
    contextType: string;
    contextId: string;
    amount: number;
    currency: string;
  }) {
    return this.prisma.$transaction([
      this.prisma.discountUsage.create({
        data: input,
      }),
      this.prisma.discount.update({
        where: { id: input.discountId },
        data: { usageCount: { increment: 1 } },
      }),
    ]);
  }
}
