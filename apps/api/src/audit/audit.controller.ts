import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ActivityService } from './activity.service';
import { RevisionService } from './revision.service';

const listSchema = z.object({
  actorId: z.string().uuid().optional(),
  aggregateType: z.string().min(1).optional(),
  aggregateId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
type ListInput = z.infer<typeof listSchema>;

@ApiTags('audit (admin)')
@Controller('v1/admin/audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(
    private readonly activity: ActivityService,
    private readonly revisions: RevisionService,
  ) {}

  @Get('activity')
  @RequirePermissions('system:audit')
  async listActivity(@Query(new ZodValidationPipe(listSchema)) q: ListInput) {
    const [data, total] = await this.activity.list(q);
    return { data, total, page: q.page, pageSize: q.pageSize };
  }

  @Get('revisions/:aggregateType/:aggregateId')
  @RequirePermissions('system:audit')
  listRevisions(
    @Param('aggregateType') aggregateType: string,
    @Param('aggregateId') aggregateId: string,
  ) {
    return this.revisions.list(aggregateType, aggregateId);
  }

  @Get('revisions/:aggregateType/:aggregateId/:version')
  @RequirePermissions('system:audit')
  getRevision(
    @Param('aggregateType') aggregateType: string,
    @Param('aggregateId') aggregateId: string,
    @Param('version') version: string,
  ) {
    return this.revisions.getOrThrow(aggregateType, aggregateId, Number(version));
  }
}
