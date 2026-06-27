import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationStatus } from '@offisdesign/database';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  NotificationsAppService,
  templateInputSchema,
  enqueueSchema,
  type TemplateInput,
  type EnqueueInput,
} from './notifications.app';

const listSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  templateKey: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

@ApiTags('notifications (admin)')
@Controller('v1/admin/notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminNotificationsController {
  constructor(private readonly app: NotificationsAppService) {}

  @Get('templates')
  @RequirePermissions('system:read')
  listTemplates() {
    return this.app.listTemplates();
  }

  @Post('templates')
  @RequirePermissions('system:audit')
  createTemplate(@Body(new ZodValidationPipe(templateInputSchema)) body: TemplateInput) {
    return this.app.createTemplate(body);
  }

  @Patch('templates/:id')
  @RequirePermissions('system:audit')
  updateTemplate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(templateInputSchema.partial())) body: Partial<TemplateInput>,
  ) {
    return this.app.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @RequirePermissions('system:audit')
  deleteTemplate(@Param('id') id: string) {
    return this.app.deleteTemplate(id);
  }

  @Post('enqueue')
  @RequirePermissions('system:audit')
  enqueue(@Body(new ZodValidationPipe(enqueueSchema)) body: EnqueueInput) {
    return this.app.enqueue(body);
  }

  @Get('deliveries')
  @RequirePermissions('system:read')
  async listDeliveries(@Query(new ZodValidationPipe(listSchema)) q: z.infer<typeof listSchema>) {
    const [data, total] = await this.app.listDeliveries(q);
    return { data, total, page: q.page, pageSize: q.pageSize };
  }

  @Post('deliveries/:id/retry')
  @RequirePermissions('system:audit')
  retry(@Param('id') id: string) {
    return this.app.retry(id);
  }
}
