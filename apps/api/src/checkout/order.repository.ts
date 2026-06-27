import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
  }

  findByNumber(number: string) {
    return this.prisma.order.findUnique({
      where: { number },
      include: { items: true, payments: true },
    });
  }

  listForCustomer(customerId: string, { page, pageSize }: { page: number; pageSize: number }) {
    return Promise.all([
      this.prisma.order.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { placedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true },
      }),
      this.prisma.order.count({ where: { customerId, deletedAt: null } }),
    ]);
  }

  create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({ data, include: { items: true, payments: true } });
  }

  updateStatus(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true, payments: true },
    });
  }

  appendEvent(input: {
    id: string;
    orderId: string;
    kind: string;
    payload: Prisma.InputJsonValue;
    actorId?: string | undefined;
  }) {
    return this.prisma.orderEvent.create({
      data: {
        id: input.id,
        orderId: input.orderId,
        kind: input.kind,
        payload: input.payload,
        ...(input.actorId !== undefined ? { actorId: input.actorId } : {}),
      },
    });
  }

  inTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
