import { Module } from '@nestjs/common';
import { WarehouseRepository } from './warehouse.repository';
import { InventoryRepository } from './inventory.repository';
import { InventoryDomainService } from './inventory.domain';
import { InventoryApplicationService } from './inventory.app';
import { AdminInventoryController } from './admin-inventory.controller';
import { StorefrontInventoryController } from './storefront-inventory.controller';

@Module({
  controllers: [AdminInventoryController, StorefrontInventoryController],
  providers: [
    WarehouseRepository,
    InventoryRepository,
    InventoryDomainService,
    InventoryApplicationService,
  ],
  exports: [InventoryApplicationService, InventoryDomainService],
})
export class InventoryModule {}
