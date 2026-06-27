import { Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { type Prisma } from '@offisdesign/database';
import { PageDomainService } from './page.domain';
import { PageRepository } from './page.repository';
import { BlogDomainService } from './blog.domain';
import { BlogRepository } from './blog.repository';
import { AncillaryRepository } from './ancillary.repository';
import { RevisionService } from '../audit/revision.service';
import { ActivityService } from '../audit/activity.service';
import { CacheService } from '../redis/cache.service';
import type {
  AnnouncementInput,
  AuthorInput,
  BlockInput,
  BlogPostInput,
  BlogPostPatch,
  FaqInput,
  NavigationInput,
  PageInput,
  PagePatch,
  TestimonialInput,
} from './dto/cms.dto';

const PAGE_KEY = (slug: string) => `cms:page:slug:${slug}`;
const POST_KEY = (slug: string) => `cms:post:slug:${slug}`;
const NAV_KEY = (key: string) => `cms:nav:${key}`;
const TTL = 60 * 5;

@Injectable()
export class CmsApplicationService {
  constructor(
    private readonly pages: PageRepository,
    private readonly pageDomain: PageDomainService,
    private readonly blog: BlogRepository,
    private readonly blogDomain: BlogDomainService,
    private readonly ancillary: AncillaryRepository,
    private readonly revisions: RevisionService,
    private readonly activity: ActivityService,
    private readonly cache: CacheService,
  ) {}

  // ── Pages ─────────────────────────────────────────────────────────────

  async listPages(query: {
    status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | undefined;
    q?: string | undefined;
    page: number;
    pageSize: number;
    includeDeleted?: boolean | undefined;
  }) {
    return this.pages.list(
      {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q ? { q: query.q } : {}),
        ...(query.includeDeleted ? { includeDeleted: true } : {}),
      },
      { page: query.page, pageSize: query.pageSize },
    );
  }

  async getPagePreview(id: string) {
    return this.pages.findById(id);
  }

  async getPublicPage(slug: string) {
    const cached = await this.cache.get<unknown>(PAGE_KEY(slug));
    if (cached) return cached;
    const page = await this.pages.findBySlug(slug);
    if (!page || page.deletedAt || page.status !== 'PUBLISHED') return null;
    await this.cache.set(PAGE_KEY(slug), page, TTL);
    return page;
  }

  async createPage(input: PageInput, actorId?: string) {
    const page = await this.pageDomain.create(input);
    await this.revisions.record({
      aggregateType: 'cms_page',
      aggregateId: page.id,
      snapshot: page as object,
      ...(actorId ? { actorId } : {}),
      reason: 'create',
    });
    await this.activity.log({
      action: 'cms.page.create',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
    });
    return page;
  }

  async updatePage(id: string, input: PagePatch, actorId?: string) {
    const before = await this.pages.findById(id);
    const page = await this.pageDomain.update(id, input);
    if (before) await this.cache.del(PAGE_KEY(before.slug));
    await this.cache.del(PAGE_KEY(page.slug));
    await this.revisions.record({
      aggregateType: 'cms_page',
      aggregateId: page.id,
      snapshot: page as object,
      ...(actorId ? { actorId } : {}),
      reason: 'update',
    });
    await this.activity.log({
      action: 'cms.page.update',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
    });
    return page;
  }

  async publishPage(id: string, actorId?: string) {
    const page = await this.pageDomain.publish(id);
    await this.cache.del(PAGE_KEY(page.slug));
    await this.activity.log({
      action: 'cms.page.publish',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
    });
    return page;
  }

  async unpublishPage(id: string, actorId?: string) {
    const page = await this.pageDomain.unpublish(id);
    await this.cache.del(PAGE_KEY(page.slug));
    await this.activity.log({
      action: 'cms.page.unpublish',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
    });
    return page;
  }

  async schedulePage(id: string, scheduledAt: Date, actorId?: string) {
    const page = await this.pageDomain.schedule(id, scheduledAt);
    await this.activity.log({
      action: 'cms.page.schedule',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
      metadata: { scheduledAt: scheduledAt.toISOString() },
    });
    return page;
  }

  async archivePage(id: string, actorId?: string) {
    const page = await this.pageDomain.archive(id);
    await this.cache.del(PAGE_KEY(page.slug));
    await this.activity.log({
      action: 'cms.page.archive',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
    });
    return page;
  }

  async deletePage(id: string, actorId?: string) {
    const page = await this.pageDomain.softDelete(id);
    await this.cache.del(PAGE_KEY(page.slug));
    await this.activity.log({
      action: 'cms.page.delete',
      aggregateType: 'cms_page',
      aggregateId: page.id,
      ...(actorId ? { actorId } : {}),
    });
    return page;
  }

  /** Restore a page to a prior revision's snapshot. */
  async restorePage(id: string, version: number, actorId?: string) {
    const revision = await this.revisions.getOrThrow('cms_page', id, version);
    const current = await this.pages.findById(id);
    if (!current) throw new Error('Page not found');
    const snapshot = revision.snapshot as {
      title: string;
      slug: string;
      kind?: 'STANDARD' | 'LANDING';
      seo?: object;
    };
    const restored = await this.pageDomain.update(id, {
      version: current.version,
      title: snapshot.title,
      slug: snapshot.slug,
      kind: snapshot.kind ?? 'STANDARD',
      ...(snapshot.seo ? { seo: snapshot.seo as Record<string, unknown> } : {}),
    });
    await this.activity.log({
      action: 'cms.page.restore',
      aggregateType: 'cms_page',
      aggregateId: id,
      ...(actorId ? { actorId } : {}),
      metadata: { fromVersion: version },
    });
    return restored;
  }

  // Blocks
  async addBlock(pageId: string, input: BlockInput, actorId?: string) {
    const block = await this.pageDomain.addBlock(pageId, input);
    const page = await this.pages.findById(pageId);
    if (page) await this.cache.del(PAGE_KEY(page.slug));
    await this.activity.log({
      action: 'cms.block.add',
      aggregateType: 'cms_block',
      aggregateId: block.id,
      ...(actorId ? { actorId } : {}),
    });
    return block;
  }

  async updateBlock(blockId: string, input: Partial<BlockInput>) {
    return this.pageDomain.updateBlock(blockId, input);
  }

  deleteBlock(blockId: string) {
    return this.pageDomain.deleteBlock(blockId);
  }

  reorderBlocks(updates: Array<{ id: string; position: number }>) {
    return this.pageDomain.reorderBlocks(updates);
  }

  // ── Blog ──────────────────────────────────────────────────────────────

  listPosts(query: {
    status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | undefined;
    q?: string | undefined;
    tag?: string | undefined;
    page: number;
    pageSize: number;
    includeDeleted?: boolean | undefined;
  }) {
    return this.blog.listPosts(
      {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q ? { q: query.q } : {}),
        ...(query.tag ? { tag: query.tag } : {}),
        ...(query.includeDeleted ? { includeDeleted: true } : {}),
      },
      { page: query.page, pageSize: query.pageSize },
    );
  }

  async getPublicPost(slug: string) {
    const cached = await this.cache.get<unknown>(POST_KEY(slug));
    if (cached) return cached;
    const post = await this.blog.findPostBySlug(slug);
    if (!post || post.deletedAt || post.status !== 'PUBLISHED') return null;
    await this.cache.set(POST_KEY(slug), post, TTL);
    return post;
  }

  async createPost(input: BlogPostInput, actorId?: string) {
    const post = await this.blogDomain.createPost(input);
    await this.revisions.record({
      aggregateType: 'blog_post',
      aggregateId: post.id,
      snapshot: post as object,
      ...(actorId ? { actorId } : {}),
      reason: 'create',
    });
    await this.activity.log({
      action: 'blog.post.create',
      aggregateType: 'blog_post',
      aggregateId: post.id,
      ...(actorId ? { actorId } : {}),
    });
    return post;
  }

  async updatePost(id: string, input: BlogPostPatch, actorId?: string) {
    const before = await this.blog.findPostById(id);
    const post = await this.blogDomain.updatePost(id, input);
    if (before) await this.cache.del(POST_KEY(before.slug));
    await this.cache.del(POST_KEY(post.slug));
    await this.revisions.record({
      aggregateType: 'blog_post',
      aggregateId: post.id,
      snapshot: post as object,
      ...(actorId ? { actorId } : {}),
      reason: 'update',
    });
    return post;
  }

  publishPost(id: string) {
    return this.blogDomain.publishPost(id);
  }

  unpublishPost(id: string) {
    return this.blogDomain.unpublishPost(id);
  }

  schedulePost(id: string, scheduledAt: Date) {
    return this.blogDomain.schedulePost(id, scheduledAt);
  }

  deletePost(id: string) {
    return this.blogDomain.deletePost(id);
  }

  listAuthors() {
    return this.blog.listAuthors();
  }

  createAuthor(input: AuthorInput) {
    return this.blogDomain.createAuthor(input);
  }

  updateAuthor(id: string, input: Partial<AuthorInput>) {
    return this.blogDomain.updateAuthor(id, input);
  }

  deleteAuthor(id: string) {
    return this.blogDomain.deleteAuthor(id);
  }

  // ── Ancillary (storefront-public listing, admin upsert) ───────────────

  async getPublicNavigation(key: string) {
    const cached = await this.cache.get<unknown>(NAV_KEY(key));
    if (cached) return cached;
    const nav = await this.ancillary.findNavigation(key);
    if (!nav) return null;
    await this.cache.set(NAV_KEY(key), nav, TTL);
    return nav;
  }

  listNavigation() {
    return this.ancillary.listNavigation();
  }

  async upsertNavigation(input: NavigationInput) {
    const nav = await this.ancillary.upsertNavigation({
      id: uuidv7(),
      key: input.key,
      name: input.name,
      items: input.items as Prisma.InputJsonValue,
    });
    await this.cache.del(NAV_KEY(input.key));
    return nav;
  }

  deleteNavigation(key: string) {
    return this.ancillary.deleteNavigation(key);
  }

  // Announcements / Testimonials / FAQs are simple — direct repo passthrough
  listPublicAnnouncements() {
    return this.ancillary.listAnnouncements();
  }
  listAdminAnnouncements() {
    return this.ancillary.listAllAnnouncements();
  }
  createAnnouncement(input: AnnouncementInput) {
    return this.ancillary.createAnnouncement({
      id: uuidv7(),
      message: input.message,
      ...(input.href ? { href: input.href } : {}),
      ...(input.startsAt ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt ? { endsAt: input.endsAt } : {}),
    });
  }
  updateAnnouncement(id: string, input: Partial<AnnouncementInput>) {
    return this.ancillary.updateAnnouncement(id, {
      ...(input.message ? { message: input.message } : {}),
      ...(input.href !== undefined ? { href: input.href ?? null } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt ?? null } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt ?? null } : {}),
    });
  }
  deleteAnnouncement(id: string) {
    return this.ancillary.deleteAnnouncement(id);
  }

  listPublicTestimonials() {
    return this.ancillary.listTestimonials(true);
  }
  listAdminTestimonials() {
    return this.ancillary.listTestimonials(false);
  }
  createTestimonial(input: TestimonialInput) {
    return this.ancillary.createTestimonial({
      id: uuidv7(),
      author: input.author,
      quote: input.quote,
      ...(input.source ? { source: input.source } : {}),
      ...(input.imageId ? { imageId: input.imageId } : {}),
      isVisible: input.isVisible,
    });
  }
  updateTestimonial(id: string, input: Partial<TestimonialInput>) {
    return this.ancillary.updateTestimonial(id, {
      ...(input.author ? { author: input.author } : {}),
      ...(input.quote ? { quote: input.quote } : {}),
      ...(input.source !== undefined ? { source: input.source ?? null } : {}),
      ...(input.imageId !== undefined ? { imageId: input.imageId ?? null } : {}),
      ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
    });
  }
  deleteTestimonial(id: string) {
    return this.ancillary.deleteTestimonial(id);
  }

  listPublicFaqs() {
    return this.ancillary.listFaqs(true);
  }
  listAdminFaqs() {
    return this.ancillary.listFaqs(false);
  }
  createFaq(input: FaqInput) {
    return this.ancillary.createFaq({
      id: uuidv7(),
      ...(input.category ? { category: input.category } : {}),
      question: input.question,
      answer: input.answer,
      position: input.position,
      isVisible: input.isVisible,
    });
  }
  updateFaq(id: string, input: Partial<FaqInput>) {
    return this.ancillary.updateFaq(id, {
      ...(input.category !== undefined ? { category: input.category ?? null } : {}),
      ...(input.question ? { question: input.question } : {}),
      ...(input.answer ? { answer: input.answer } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
    });
  }
  deleteFaq(id: string) {
    return this.ancillary.deleteFaq(id);
  }
}
