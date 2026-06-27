import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { InventoryDomainService } from './inventory.domain';
import { WarehouseRepository } from './warehouse.repository';
import { InventoryRepository } from './inventory.repository';
import { EventBus } from '../events/event-bus.service';
import type { AdjustStockInput, ReserveStockInput, WarehouseInput } from './dto/inventory.dto';

@Injectable()
export class InventoryApplicationService {
  constructor(
    private readonly domain: InventoryDomainService,
    private readonly warehouses: WarehouseRepository,
    private readonly repo: InventoryRepository,
    private readonly events: EventBus,
  ) {}

  // ── Warehouses ────────────────────────────────────────────────────────

  listWarehouses() {
    return this.warehouses.list();
  }

  async createWarehouse(input: WarehouseInput) {
    if (await this.warehouses.codeExists(input.code)) {
      throw new ConflictException({
        code: 'CODE_TAKEN',
        message: `Warehouse code "${input.code}" is in use.`,
      });
    }
    return this.warehouses.create({
      id: uuidv7(),
      code: input.code,
      name: input.name,
      countryCode: input.countryCode,
      isActive: input.isActive,
    });
  }

  async updateWarehouse(id: string, input: Partial<WarehouseInput>) {
    const existing = await this.warehouses.findById(id);
    if (!existing) throw new NotFoundException();
    return this.warehouses.update(id, input);
  }

  async deleteWarehouse(id: string) {
    const existing = await this.warehouses.findById(id);
    if (!existing) throw new NotFoundException();
    return this.warehouses.delete(id);
  }

  // ── Stock ─────────────────────────────────────────────────────────────

  async adjust(input: AdjustStockInput, actorId?: string) {
    const item = await this.domain.adjust({ ...input, ...(actorId ? { actorId } : {}) });
    await this.events.publish(
      'inventory.adjusted',
      'inventory_item',
      item.id,
      {
        inventoryItemId: item.id,
        variantId: input.variantId,
        delta: input.delta,
        reason: input.reason,
      },
      actorId,
    );
    return item;
  }

  async reserve(input: ReserveStockInput, actorId?: string) {
    const result = await this.domain.reserve(input);
    await this.events.publish(
      'inventory.reserved',
      'inventory_item',
      result.item.id,
      {
        inventoryItemId: result.item.id,
        variantId: input.variantId,
        contextType: input.contextType,
        contextId: input.contextId,
        quantity: input.quantity,
      },
      actorId,
    );
    return result;
  }

  async release(reservationId: string, actorId?: string) {
    const reservation = await this.domain.release(reservationId);
    const item = await this.repo.findItemById(reservation.inventoryItemId);
    if (item) {
      await this.events.publish(
        'inventory.released',
        'inventory_item',
        item.id,
        {
          inventoryItemId: item.id,
          variantId: item.variantId,
          contextType: reservation.contextType,
          contextId: reservation.contextId,
          quantity: reservation.quantity,
        },
        actorId,
      );
    }
    return reservation;
  }

  async commit(reservationId: string, actorId?: string) {
    const reservation = await this.domain.commit(reservationId);
    const item = await this.repo.findItemById(reservation.inventoryItemId);
    if (item) {
      await this.events.publish(
        'inventory.committed',
        'inventory_item',
        item.id,
        {
          inventoryItemId: item.id,
          variantId: item.variantId,
          contextType: reservation.contextType,
          contextId: reservation.contextId,
          quantity: reservation.quantity,
        },
        actorId,
      );
    }
    return reservation;
  }

  expireStale() {
    return this.domain.expireStale();
  }

  history(inventoryItemId: string) {
    return this.domain.history(inventoryItemId);
  }
}
