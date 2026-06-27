import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { InventoryApplicationService } from './inventory.app';
import {
  adjustStockSchema,
  type AdjustStockInput,
  reserveStockSchema,
  type ReserveStockInput,
  warehouseInputSchema,
  type WarehouseInput,
} from './dto/inventory.dto';
import type { Principal } from '../auth/principal';

@ApiTags('inventory (admin)')
@Controller('v1/admin/inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminInventoryController {
  constructor(private readonly app: InventoryApplicationService) {}

  // Warehouses
  @Get('warehouses')
  @RequirePermissions('inventory:read')
  listWarehouses() {
    return this.app.listWarehouses();
  }

  @Post('warehouses')
  @RequirePermissions('inventory:write')
  createWarehouse(@Body(new ZodValidationPipe(warehouseInputSchema)) body: WarehouseInput) {
    return this.app.createWarehouse(body);
  }

  @Patch('warehouses/:id')
  @RequirePermissions('inventory:write')
  updateWarehouse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(warehouseInputSchema.partial())) body: Partial<WarehouseInput>,
  ) {
    return this.app.updateWarehouse(id, body);
  }

  @Delete('warehouses/:id')
  @RequirePermissions('inventory:write')
  deleteWarehouse(@Param('id') id: string) {
    return this.app.deleteWarehouse(id);
  }

  // Stock operations
  @Post('adjust')
  @RequirePermissions('inventory:write')
  adjust(
    @Body(new ZodValidationPipe(adjustStockSchema)) body: AdjustStockInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.adjust(body, p.id);
  }

  @Post('reserve')
  @RequirePermissions('inventory:write')
  reserve(
    @Body(new ZodValidationPipe(reserveStockSchema)) body: ReserveStockInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.reserve(body, p.id);
  }

  @Post('reservations/:id/release')
  @RequirePermissions('inventory:write')
  release(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.release(id, p.id);
  }

  @Post('reservations/:id/commit')
  @RequirePermissions('inventory:write')
  commit(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.commit(id, p.id);
  }

  @Get('items/:id/history')
  @RequirePermissions('inventory:read')
  history(@Param('id') id: string) {
    return this.app.history(id);
  }
}
