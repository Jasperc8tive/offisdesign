import { Injectable } from '@nestjs/common';
import { CheckoutStatus, type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.checkoutSession.findUnique({ where: { id } });
  }

  findByCart(cartId: string) {
    return this.prisma.checkoutSession.findUnique({ where: { cartId } });
  }

  create(data: Prisma.CheckoutSessionCreateInput) {
    return this.prisma.checkoutSession.create({ data });
  }

  /** Optimistic update returning null on stale version. */
  async update(
    id: string,
    expectedVersion: number,
    data: Prisma.CheckoutSessionUpdateManyMutationInput,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const res = await tx.checkoutSession.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (res.count === 0) return null;
    return this.findById(id, tx);
  }

  findExpired(limit = 200) {
    return this.prisma.checkoutSession.findMany({
      where: {
        status: { in: [CheckoutStatus.PENDING, CheckoutStatus.AWAITING_PAYMENT] },
        expiresAt: { lt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });
  }
}
