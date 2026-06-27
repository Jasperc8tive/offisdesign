import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import {
  FeatureFlagService,
  featureFlagInputSchema,
  featureFlagPatchSchema,
  type FeatureFlagInput,
  type FeatureFlagPatch,
} from './feature-flag.service';
import { SettingsService, settingUpsertSchema, type SettingUpsertInput } from './settings.service';
import { MaintenanceService } from './maintenance.service';
import { CacheService } from '../redis/cache.service';
import { RedisService } from '../redis/redis.service';
import type { Principal } from '../auth/principal';

const cacheBodySchema = z.object({ keys: z.array(z.string().min(1)).min(1).max(100) });
const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(280).optional(),
});

@ApiTags('operations (admin)')
@Controller('v1/admin/ops')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminOpsController {
  constructor(
    private readonly flags: FeatureFlagService,
    private readonly settings: SettingsService,
    private readonly maintenance: MaintenanceService,
    private readonly cache: CacheService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  // Feature flags
  @Get('flags')
  @RequirePermissions('system:read')
  listFlags() {
    return this.flags.list();
  }

  @Post('flags')
  @RequirePermissions('system:audit')
  createFlag(@Body(new ZodValidationPipe(featureFlagInputSchema)) body: FeatureFlagInput) {
    return this.flags.create(body);
  }

  @Patch('flags/:id')
  @RequirePermissions('system:audit')
  updateFlag(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(featureFlagPatchSchema)) body: FeatureFlagPatch,
  ) {
    return this.flags.update(id, body);
  }

  @Delete('flags/:id')
  @RequirePermissions('system:audit')
  deleteFlag(@Param('id') id: string) {
    return this.flags.delete(id);
  }

  @Get('flags/:key/evaluate/:subject')
  @RequirePermissions('system:read')
  async evaluate(@Param('key') key: string, @Param('subject') subject: string) {
    return { enabled: await this.flags.isEnabled(key, subject) };
  }

  // Settings
  @Get('settings')
  @RequirePermissions('system:read')
  listSettings() {
    return this.settings.listAll();
  }

  @Post('settings')
  @RequirePermissions('system:audit')
  upsertSetting(
    @Body(new ZodValidationPipe(settingUpsertSchema)) body: SettingUpsertInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.settings.upsert(body, p.id);
  }

  @Delete('settings/:key')
  @RequirePermissions('system:audit')
  deleteSetting(@Param('key') key: string) {
    return this.settings.delete(key);
  }

  // Maintenance
  @Get('maintenance')
  @RequirePermissions('system:read')
  getMaintenance() {
    return this.maintenance.getState();
  }

  @Post('maintenance')
  @RequirePermissions('system:audit')
  setMaintenance(
    @Body(new ZodValidationPipe(maintenanceSchema)) body: z.infer<typeof maintenanceSchema>,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.maintenance.setState(
      {
        enabled: body.enabled,
        ...(body.message ? { message: body.message } : {}),
        since: new Date().toISOString(),
      },
      p.id,
    );
  }

  // Cache management
  @Post('cache/invalidate')
  @RequirePermissions('system:audit')
  async invalidateKeys(
    @Body(new ZodValidationPipe(cacheBodySchema)) body: z.infer<typeof cacheBodySchema>,
  ) {
    for (const key of body.keys) await this.cache.del(key);
    return { invalidated: body.keys.length };
  }

  @Post('cache/flush')
  @RequirePermissions('system:audit')
  async flush() {
    await this.redis.client.flushdb();
    return { flushed: true };
  }
}
