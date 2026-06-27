import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { WebhooksAppService, webhookInputSchema, type WebhookInput } from './webhooks.app';

@ApiTags('webhooks (admin)')
@Controller('v1/admin/webhooks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminWebhooksController {
  constructor(private readonly app: WebhooksAppService) {}

  @Get()
  @RequirePermissions('system:audit')
  list() {
    return this.app.list();
  }

  @Post()
  @RequirePermissions('system:audit')
  create(@Body(new ZodValidationPipe(webhookInputSchema)) body: WebhookInput) {
    return this.app.create(body);
  }

  @Patch(':id')
  @RequirePermissions('system:audit')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(webhookInputSchema.partial())) body: Partial<WebhookInput>,
  ) {
    return this.app.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('system:audit')
  remove(@Param('id') id: string) {
    return this.app.remove(id);
  }

  @Post(':id/rotate-secret')
  @RequirePermissions('system:audit')
  rotateSecret(@Param('id') id: string) {
    return this.app.rotateSecret(id);
  }

  @Get(':id/deliveries')
  @RequirePermissions('system:audit')
  deliveries(@Param('id') id: string) {
    return this.app.listDeliveries(id);
  }

  @Post('deliveries/:id/replay')
  @RequirePermissions('system:audit')
  replay(@Param('id') id: string) {
    return this.app.replay(id);
  }
}
