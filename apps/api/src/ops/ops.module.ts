import { Module } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { SettingsService } from './settings.service';
import { MaintenanceService } from './maintenance.service';
import { AdminOpsController } from './admin-ops.controller';
import { StorefrontOpsController } from './storefront-ops.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminOpsController, StorefrontOpsController],
  providers: [FeatureFlagService, SettingsService, MaintenanceService],
  exports: [FeatureFlagService, SettingsService, MaintenanceService],
})
export class OpsModule {}
