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
import { CmsApplicationService } from './cms.app';
import {
  announcementInputSchema,
  type AnnouncementInput,
  authorInputSchema,
  type AuthorInput,
  blockInputSchema,
  type BlockInput,
  blogPostInputSchema,
  blogPostPatchSchema,
  type BlogPostInput,
  type BlogPostPatch,
  faqInputSchema,
  type FaqInput,
  navigationInputSchema,
  type NavigationInput,
  pageInputSchema,
  pagePatchSchema,
  type PageInput,
  type PagePatch,
  testimonialInputSchema,
  type TestimonialInput,
} from './dto/cms.dto';
import type { Principal } from '../auth/principal';

const listSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  q: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  includeDeleted: z.coerce.boolean().default(false),
});
type ListQuery = z.infer<typeof listSchema>;

const reorderSchema = z.object({
  blocks: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) })),
});

const scheduleSchema = z.object({ scheduledAt: z.coerce.date() });

@ApiTags('cms (admin)')
@Controller('v1/admin/cms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminCmsController {
  constructor(private readonly app: CmsApplicationService) {}

  // ── Pages ─────────────────────────────────────────────────────────────

  @Get('pages')
  @RequirePermissions('cms:read')
  listPages(@Query(new ZodValidationPipe(listSchema)) q: ListQuery) {
    return this.app.listPages(q);
  }

  @Get('pages/:id')
  @RequirePermissions('cms:read')
  page(@Param('id') id: string) {
    return this.app.getPagePreview(id);
  }

  @Post('pages')
  @RequirePermissions('cms:write')
  createPage(
    @Body(new ZodValidationPipe(pageInputSchema)) body: PageInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.createPage(body, p.id);
  }

  @Patch('pages/:id')
  @RequirePermissions('cms:write')
  updatePage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(pagePatchSchema)) body: PagePatch,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.updatePage(id, body, p.id);
  }

  @Post('pages/:id/publish')
  @RequirePermissions('cms:publish')
  publishPage(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.publishPage(id, p.id);
  }

  @Post('pages/:id/unpublish')
  @RequirePermissions('cms:publish')
  unpublishPage(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.unpublishPage(id, p.id);
  }

  @Post('pages/:id/schedule')
  @RequirePermissions('cms:publish')
  schedulePage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(scheduleSchema)) body: z.infer<typeof scheduleSchema>,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.schedulePage(id, body.scheduledAt, p.id);
  }

  @Post('pages/:id/archive')
  @RequirePermissions('cms:publish')
  archivePage(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.archivePage(id, p.id);
  }

  @Delete('pages/:id')
  @RequirePermissions('cms:write')
  deletePage(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.deletePage(id, p.id);
  }

  @Post('pages/:id/restore/:version')
  @RequirePermissions('cms:write')
  restorePage(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.restorePage(id, Number(version), p.id);
  }

  // Blocks
  @Post('pages/:id/blocks')
  @RequirePermissions('cms:write')
  addBlock(
    @Param('id') pageId: string,
    @Body(new ZodValidationPipe(blockInputSchema)) body: BlockInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.addBlock(pageId, body, p.id);
  }

  @Patch('blocks/:id')
  @RequirePermissions('cms:write')
  updateBlock(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(blockInputSchema.partial())) body: Partial<BlockInput>,
  ) {
    return this.app.updateBlock(id, body);
  }

  @Delete('blocks/:id')
  @RequirePermissions('cms:write')
  deleteBlock(@Param('id') id: string) {
    return this.app.deleteBlock(id);
  }

  @Post('pages/:id/blocks/reorder')
  @RequirePermissions('cms:write')
  reorderBlocks(
    @Param('id') _pageId: string,
    @Body(new ZodValidationPipe(reorderSchema)) body: z.infer<typeof reorderSchema>,
  ) {
    return this.app.reorderBlocks(body.blocks);
  }

  // ── Blog ──────────────────────────────────────────────────────────────

  @Get('posts')
  @RequirePermissions('cms:read')
  listPosts(@Query(new ZodValidationPipe(listSchema)) q: ListQuery) {
    return this.app.listPosts(q);
  }

  @Post('posts')
  @RequirePermissions('cms:write')
  createPost(
    @Body(new ZodValidationPipe(blogPostInputSchema)) body: BlogPostInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.createPost(body, p.id);
  }

  @Patch('posts/:id')
  @RequirePermissions('cms:write')
  updatePost(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(blogPostPatchSchema)) body: BlogPostPatch,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.updatePost(id, body, p.id);
  }

  @Post('posts/:id/publish')
  @RequirePermissions('cms:publish')
  publishPost(@Param('id') id: string) {
    return this.app.publishPost(id);
  }

  @Post('posts/:id/unpublish')
  @RequirePermissions('cms:publish')
  unpublishPost(@Param('id') id: string) {
    return this.app.unpublishPost(id);
  }

  @Post('posts/:id/schedule')
  @RequirePermissions('cms:publish')
  schedulePost(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(scheduleSchema)) body: z.infer<typeof scheduleSchema>,
  ) {
    return this.app.schedulePost(id, body.scheduledAt);
  }

  @Delete('posts/:id')
  @RequirePermissions('cms:write')
  deletePost(@Param('id') id: string) {
    return this.app.deletePost(id);
  }

  // Authors
  @Get('authors')
  @RequirePermissions('cms:read')
  listAuthors() {
    return this.app.listAuthors();
  }

  @Post('authors')
  @RequirePermissions('cms:write')
  createAuthor(@Body(new ZodValidationPipe(authorInputSchema)) body: AuthorInput) {
    return this.app.createAuthor(body);
  }

  @Patch('authors/:id')
  @RequirePermissions('cms:write')
  updateAuthor(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(authorInputSchema.partial())) body: Partial<AuthorInput>,
  ) {
    return this.app.updateAuthor(id, body);
  }

  @Delete('authors/:id')
  @RequirePermissions('cms:write')
  deleteAuthor(@Param('id') id: string) {
    return this.app.deleteAuthor(id);
  }

  // ── Navigation / announcements / testimonials / FAQs ──────────────────

  @Get('navigation')
  @RequirePermissions('cms:read')
  listNavigation() {
    return this.app.listNavigation();
  }

  @Post('navigation')
  @RequirePermissions('cms:write')
  upsertNavigation(@Body(new ZodValidationPipe(navigationInputSchema)) body: NavigationInput) {
    return this.app.upsertNavigation(body);
  }

  @Delete('navigation/:key')
  @RequirePermissions('cms:write')
  deleteNavigation(@Param('key') key: string) {
    return this.app.deleteNavigation(key);
  }

  @Get('announcements')
  @RequirePermissions('cms:read')
  listAnnouncements() {
    return this.app.listAdminAnnouncements();
  }
  @Post('announcements')
  @RequirePermissions('cms:write')
  createAnnouncement(
    @Body(new ZodValidationPipe(announcementInputSchema)) body: AnnouncementInput,
  ) {
    return this.app.createAnnouncement(body);
  }
  @Patch('announcements/:id')
  @RequirePermissions('cms:write')
  updateAnnouncement(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(announcementInputSchema.partial()))
    body: Partial<AnnouncementInput>,
  ) {
    return this.app.updateAnnouncement(id, body);
  }
  @Delete('announcements/:id')
  @RequirePermissions('cms:write')
  deleteAnnouncement(@Param('id') id: string) {
    return this.app.deleteAnnouncement(id);
  }

  @Get('testimonials')
  @RequirePermissions('cms:read')
  listTestimonials() {
    return this.app.listAdminTestimonials();
  }
  @Post('testimonials')
  @RequirePermissions('cms:write')
  createTestimonial(@Body(new ZodValidationPipe(testimonialInputSchema)) body: TestimonialInput) {
    return this.app.createTestimonial(body);
  }
  @Patch('testimonials/:id')
  @RequirePermissions('cms:write')
  updateTestimonial(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(testimonialInputSchema.partial()))
    body: Partial<TestimonialInput>,
  ) {
    return this.app.updateTestimonial(id, body);
  }
  @Delete('testimonials/:id')
  @RequirePermissions('cms:write')
  deleteTestimonial(@Param('id') id: string) {
    return this.app.deleteTestimonial(id);
  }

  @Get('faqs')
  @RequirePermissions('cms:read')
  listFaqs() {
    return this.app.listAdminFaqs();
  }
  @Post('faqs')
  @RequirePermissions('cms:write')
  createFaq(@Body(new ZodValidationPipe(faqInputSchema)) body: FaqInput) {
    return this.app.createFaq(body);
  }
  @Patch('faqs/:id')
  @RequirePermissions('cms:write')
  updateFaq(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(faqInputSchema.partial())) body: Partial<FaqInput>,
  ) {
    return this.app.updateFaq(id, body);
  }
  @Delete('faqs/:id')
  @RequirePermissions('cms:write')
  deleteFaq(@Param('id') id: string) {
    return this.app.deleteFaq(id);
  }
}
