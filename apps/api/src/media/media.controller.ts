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
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MediaApplicationService } from './media.app';
import {
  folderInputSchema,
  type FolderInput,
  finalizeUploadSchema,
  type FinalizeUploadInput,
  presignUploadSchema,
  type PresignUploadInput,
  updateMediaSchema,
  type UpdateMediaInput,
} from './dto/media.dto';
import type { Principal } from '../auth/principal';

const listSchema = z.object({
  folderId: z.string().uuid().nullish(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  includeDeleted: z.coerce.boolean().default(false),
});
type ListQuery = z.infer<typeof listSchema>;

@ApiTags('media (admin)')
@Controller('v1/admin/media')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminMediaController {
  constructor(private readonly app: MediaApplicationService) {}

  @Get('folders')
  @RequirePermissions('cms:read')
  listFolders() {
    return this.app.listFolders();
  }

  @Post('folders')
  @RequirePermissions('cms:write')
  createFolder(@Body(new ZodValidationPipe(folderInputSchema)) body: FolderInput) {
    return this.app.createFolder(body);
  }

  @Delete('folders/:id')
  @RequirePermissions('cms:write')
  deleteFolder(@Param('id') id: string) {
    return this.app.deleteFolder(id);
  }

  @Post('presign')
  @RequirePermissions('cms:write')
  presign(
    @Body(new ZodValidationPipe(presignUploadSchema)) body: PresignUploadInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.presignUpload(body, p.id);
  }

  @Post('finalize')
  @RequirePermissions('cms:write')
  finalize(
    @Body(new ZodValidationPipe(finalizeUploadSchema)) body: FinalizeUploadInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.finalizeUpload(body, p.id);
  }

  @Get()
  @RequirePermissions('cms:read')
  list(@Query(new ZodValidationPipe(listSchema)) q: ListQuery) {
    return this.app.list(q);
  }

  @Patch(':id')
  @RequirePermissions('cms:write')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMediaSchema)) body: UpdateMediaInput,
  ) {
    return this.app.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('cms:write')
  delete(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.delete(id, p.id);
  }
}
