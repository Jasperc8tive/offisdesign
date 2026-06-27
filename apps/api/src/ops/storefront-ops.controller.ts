import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { SettingsService } from './settings.service';

@ApiTags('operations (public)')
@Controller('v1/storefront/ops')
export class StorefrontOpsController {
  constructor(
    private readonly maintenance: MaintenanceService,
    private readonly settings: SettingsService,
  ) {}

  @Get('maintenance')
  maintenanceState() {
    return this.maintenance.getState();
  }

  @Get('settings')
  publicSettings() {
    return this.settings.listPublic();
  }
}
