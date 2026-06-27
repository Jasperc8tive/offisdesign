import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { PrismaService } from '../prisma/prisma.service';

const WITH_ITEMS = { items: true } as const;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.cart.findUnique({ where: { id }, include: WITH_ITEMS });
  }

  findActiveByAnonymous(anonymousId: string) {
    return this.prisma.cart.findFirst({
      where: { anonymousId, status: 'ACTIVE' },
      include: WITH_ITEMS,
    });
  }

  findActiveByCustomer(customerId: string) {
    return this.prisma.cart.findFirst({
      where: { customerId, status: 'ACTIVE' },
      include: WITH_ITEMS,
    });
  }

  create(data: Prisma.CartCreateInput) {
    return this.prisma.cart.create({ data, include: WITH_ITEMS });
  }

  /**
   * Optimistic update — caller passes the version it read; mismatched writers
   * see updateMany count 0 and the application service retries.
   */
  async update(id: string, expectedVersion: number, data: Prisma.CartUpdateInput) {
    const res = await this.prisma.cart.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    if (res.count === 0) return null;
    return this.findById(id);
  }

  markStatus(id: string, status: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED') {
    return this.prisma.cart.update({ where: { id }, data: { status } });
  }

  async upsertItem(
    cartId: string,
    variantId: string,
    quantity: number,
    unitAmount: number,
    currency: string,
  ) {
    return this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      update: { quantity, unitAmount, currency },
      create: {
        id: uuidv7(),
        cartId,
        variantId,
        quantity,
        unitAmount,
        currency,
      },
    });
  }

  removeItem(cartId: string, variantId: string) {
    return this.prisma.cartItem.delete({
      where: { cartId_variantId: { cartId, variantId } },
    });
  }

  clearItems(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
