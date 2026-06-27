import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockReservationStatus, type StockAdjustmentReason } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { InventoryRepository } from './inventory.repository';

/**
 * Inventory domain rules:
 * - `available = onHand - reserved`. Reservations cannot exceed available.
 * - Adjustments are append-only ledger entries; the running InventoryItem is
 *   updated under optimistic concurrency control.
 * - Each operation retries up to RETRY_ATTEMPTS times if the version check fails,
 *   surfacing 409 to the caller if every attempt loses the race.
 */
const RETRY_ATTEMPTS = 4;

@Injectable()
export class InventoryDomainService {
  constructor(private readonly repo: InventoryRepository) {}

  async adjust(input: {
    variantId: string;
    warehouseId: string;
    delta: number;
    reason: StockAdjustmentReason;
    reference?: string | undefined;
    actorId?: string | undefined;
  }) {
    if (input.delta === 0) {
      throw new BadRequestException({ code: 'ZERO_DELTA', message: 'Delta must be non-zero.' });
    }
    const item = await this.repo.upsertItem(uuidv7(), input.variantId, input.warehouseId);

    return this.withRetry(async () => {
      const current = await this.repo.findItemById(item.id);
      if (!current) throw new NotFoundException();
      const projected = current.onHand + input.delta;
      if (projected < current.reserved) {
        throw new BadRequestException({
          code: 'WOULD_GO_NEGATIVE',
          message: 'Adjustment would reduce on-hand below reserved.',
          details: {
            onHand: current.onHand,
            reserved: current.reserved,
            delta: input.delta,
            projected,
          },
        });
      }
      const next = await this.repo.applyDelta(current.id, current.version, input.delta, 0);
      if (!next) return null;
      await this.repo.appendAdjustment({
        id: uuidv7(),
        inventoryItemId: current.id,
        delta: input.delta,
        reason: input.reason,
        ...(input.reference !== undefined ? { reference: input.reference } : {}),
        ...(input.actorId !== undefined ? { actorId: input.actorId } : {}),
      });
      return next;
    });
  }

  async reserve(input: {
    variantId: string;
    warehouseId: string;
    quantity: number;
    contextType: string;
    contextId: string;
    ttlSec: number;
  }) {
    if (input.quantity <= 0) {
      throw new BadRequestException({
        code: 'NON_POSITIVE_QTY',
        message: 'Quantity must be positive.',
      });
    }
    const item = await this.repo.upsertItem(uuidv7(), input.variantId, input.warehouseId);
    const expiresAt = new Date(Date.now() + input.ttlSec * 1000);

    return this.withRetry(async () => {
      const current = await this.repo.findItemById(item.id);
      if (!current) throw new NotFoundException();
      const available = current.onHand - current.reserved;
      if (input.quantity > available) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: 'Not enough available stock.',
          details: { requested: input.quantity, available },
        });
      }
      const next = await this.repo.applyDelta(current.id, current.version, 0, input.quantity);
      if (!next) return null;
      const reservation = await this.repo.createReservation({
        id: uuidv7(),
        inventoryItemId: current.id,
        contextType: input.contextType,
        contextId: input.contextId,
        quantity: input.quantity,
        expiresAt,
      });
      return { item: next, reservation };
    });
  }

  async release(reservationId: string) {
    const reservation = await this.repo.findReservation(reservationId);
    if (!reservation) throw new NotFoundException();
    if (reservation.status !== StockReservationStatus.HELD) {
      return reservation; // idempotent
    }
    return this.withRetry(async () => {
      const item = await this.repo.findItemById(reservation.inventoryItemId);
      if (!item) throw new NotFoundException();
      const next = await this.repo.applyDelta(item.id, item.version, 0, -reservation.quantity);
      if (!next) return null;
      await this.repo.markReservation(reservationId, StockReservationStatus.RELEASED);
      return { ...reservation, status: StockReservationStatus.RELEASED };
    });
  }

  async commit(reservationId: string) {
    const reservation = await this.repo.findReservation(reservationId);
    if (!reservation) throw new NotFoundException();
    if (reservation.status === StockReservationStatus.CONSUMED) {
      return reservation;
    }
    if (reservation.status !== StockReservationStatus.HELD) {
      throw new ConflictException({
        code: 'RESERVATION_NOT_HELD',
        message: `Reservation status is ${reservation.status}, cannot commit.`,
      });
    }
    return this.withRetry(async () => {
      const item = await this.repo.findItemById(reservation.inventoryItemId);
      if (!item) throw new NotFoundException();
      // Commit = remove from reserved AND from onHand.
      const next = await this.repo.applyDelta(
        item.id,
        item.version,
        -reservation.quantity,
        -reservation.quantity,
      );
      if (!next) return null;
      await this.repo.markReservation(reservationId, StockReservationStatus.CONSUMED);
      return { ...reservation, status: StockReservationStatus.CONSUMED };
    });
  }

  async expireStale(): Promise<number> {
    const expired = await this.repo.findExpiredHeld();
    let count = 0;
    for (const r of expired) {
      try {
        await this.release(r.id);
        await this.repo.markReservation(r.id, StockReservationStatus.EXPIRED);
        count++;
      } catch {
        // Skip and move on — cron will pick it up next run.
      }
    }
    return count;
  }

  history(inventoryItemId: string) {
    return this.repo.listAdjustments(inventoryItemId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async withRetry<T>(fn: () => Promise<T | null>): Promise<T> {
    let last: T | null = null;
    for (let i = 0; i < RETRY_ATTEMPTS; i++) {
      const result = await fn();
      if (result !== null) return result;
      last = result;
    }
    throw new ConflictException({
      code: 'STALE_VERSION',
      message: 'Concurrent inventory write; retry after backoff.',
    });
    // unreachable
    return last as T;
  }
}
