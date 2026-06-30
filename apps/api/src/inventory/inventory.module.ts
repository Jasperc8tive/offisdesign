import { Module } from '@nestjs/common';
import { WarehouseRepository } from './warehouse.repository';
import { InventoryRepository } from './inventory.repository';
import { InventoryDomainService } from './inventory.domain';
import { InventoryApplicationService } from './inventory.app';
import { AdminInventoryController } from './admin-inventory.controller';
import { StorefrontInventoryController } from './storefront-inventory.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
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
