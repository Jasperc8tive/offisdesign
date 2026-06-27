import { Injectable } from '@nestjs/common';
import { type Prisma, StockAdjustmentReason, StockReservationStatus } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findItem(variantId: string, warehouseId: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });
  }

  findItemById(id: string) {
    return this.prisma.inventoryItem.findUnique({ where: { id } });
  }

  upsertItem(id: string, variantId: string, warehouseId: string) {
    return this.prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      update: {},
      create: { id, variantId, warehouseId, onHand: 0, reserved: 0, version: 0 },
    });
  }

  /**
   * Optimistic update: assert the row's current version. Returns the row when
   * the WHERE clause matched; `null` when another writer mutated the row in
   * between read and write.
   */
  async applyDelta(
    id: string,
    expectedVersion: number,
    deltaOnHand: number,
    deltaReserved: number,
  ) {
    const res = await this.prisma.inventoryItem.updateMany({
      where: { id, version: expectedVersion },
      data: {
        onHand: { increment: deltaOnHand },
        reserved: { increment: deltaReserved },
        version: { increment: 1 },
      },
    });
    if (res.count === 0) return null;
    return this.findItemById(id);
  }

  appendAdjustment(input: {
    id: string;
    inventoryItemId: string;
    delta: number;
    reason: StockAdjustmentReason;
    reference?: string | undefined;
    actorId?: string | undefined;
  }) {
    return this.prisma.stockAdjustment.create({
      data: {
        id: input.id,
        inventoryItemId: input.inventoryItemId,
        delta: input.delta,
        reason: input.reason,
        ...(input.reference !== undefined ? { reference: input.reference } : {}),
        ...(input.actorId !== undefined ? { actorId: input.actorId } : {}),
      },
    });
  }

  createReservation(input: {
    id: string;
    inventoryItemId: string;
    contextType: string;
    contextId: string;
    quantity: number;
    expiresAt: Date;
  }) {
    return this.prisma.stockReservation.create({
      data: {
        id: input.id,
        inventoryItemId: input.inventoryItemId,
        contextType: input.contextType,
        contextId: input.contextId,
        quantity: input.quantity,
        expiresAt: input.expiresAt,
        status: StockReservationStatus.HELD,
      },
    });
  }

  findReservation(id: string) {
    return this.prisma.stockReservation.findUnique({ where: { id } });
  }

  markReservation(id: string, status: StockReservationStatus) {
    return this.prisma.stockReservation.update({
      where: { id },
      data: { status },
    });
  }

  /** Find reservations that have expired but are still HELD. */
  findExpiredHeld(limit = 200) {
    return this.prisma.stockReservation.findMany({
      where: {
        status: StockReservationStatus.HELD,
        expiresAt: { lt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });
  }

  listAdjustments(inventoryItemId: string, limit = 100) {
    return this.prisma.stockAdjustment.findMany({
      where: { inventoryItemId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  inTx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
