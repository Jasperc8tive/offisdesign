import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CmsStatus, type Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { PageRepository } from './page.repository';
import { slugify, uniqueSlug } from '../common/slug';
import type { BlockInput, PageInput, PagePatch } from './dto/cms.dto';

@Injectable()
export class PageDomainService {
  constructor(private readonly pages: PageRepository) {}

  async create(input: PageInput) {
    const slug = input.slug
      ? await this.ensureFreshSlug(input.slug)
      : await uniqueSlug(input.title, (s) => this.pages.slugExists(s));
    const now = new Date();
    return this.pages.create({
      id: uuidv7(),
      slug,
      title: input.title,
      kind: input.kind,
      ...(input.seo ? { seo: input.seo as Prisma.InputJsonValue } : {}),
      status: input.status,
      ...(input.status === 'PUBLISHED' ? { publishedAt: now } : {}),
      ...(input.scheduledAt ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.unscheduledAt ? { unscheduledAt: input.unscheduledAt } : {}),
    });
  }

  async update(id: string, input: PagePatch) {
    const existing = await this.pages.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (existing.version !== input.version) {
      throw new ConflictException({
        code: 'STALE_VERSION',
        details: { currentVersion: existing.version, suppliedVersion: input.version },
      });
    }
    const nextSlug =
      input.slug && slugify(input.slug) !== existing.slug
        ? await this.ensureFreshSlug(input.slug)
        : undefined;
    const data: Prisma.CmsPageUpdateInput = {
      ...(input.title ? { title: input.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.seo !== undefined ? { seo: input.seo as Prisma.InputJsonValue } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === 'PUBLISHED' && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt ?? null } : {}),
      ...(input.unscheduledAt !== undefined ? { unscheduledAt: input.unscheduledAt ?? null } : {}),
    };
    const updated = await this.pages.update(id, input.version, data);
    if (!updated) throw new ConflictException({ code: 'STALE_VERSION' });
    return updated;
  }

  async publish(id: string) {
    const existing = await this.pages.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (existing.status === CmsStatus.PUBLISHED) return existing;
    const updated = await this.pages.update(id, existing.version, {
      status: CmsStatus.PUBLISHED,
      publishedAt: existing.publishedAt ?? new Date(),
      scheduledAt: null,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async unpublish(id: string) {
    const existing = await this.pages.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const updated = await this.pages.update(id, existing.version, {
      status: CmsStatus.DRAFT,
      unscheduledAt: null,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async schedule(id: string, scheduledAt: Date) {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: 'SCHEDULE_IN_PAST',
        message: 'Scheduled time must be in the future.',
      });
    }
    const existing = await this.pages.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const updated = await this.pages.update(id, existing.version, {
      status: CmsStatus.SCHEDULED,
      scheduledAt,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async archive(id: string) {
    const existing = await this.pages.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const updated = await this.pages.update(id, existing.version, {
      status: CmsStatus.ARCHIVED,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async softDelete(id: string) {
    const existing = await this.pages.findById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.pages.softDelete(id);
  }

  // ── Blocks ────────────────────────────────────────────────────────────

  async addBlock(pageId: string, input: BlockInput) {
    const page = await this.pages.findById(pageId);
    if (!page || page.deletedAt) throw new NotFoundException();
    return this.pages.createBlock({
      id: uuidv7(),
      pageId,
      kind: input.kind,
      position: input.position,
      payload: input.payload as Prisma.InputJsonValue,
    });
  }

  async updateBlock(blockId: string, input: Partial<BlockInput>) {
    return this.pages.updateBlock(blockId, {
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.payload !== undefined ? { payload: input.payload as Prisma.InputJsonValue } : {}),
    });
  }

  deleteBlock(blockId: string) {
    return this.pages.deleteBlock(blockId);
  }

  reorderBlocks(updates: Array<{ id: string; position: number }>) {
    return this.pages.reorderBlocks(updates);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async ensureFreshSlug(supplied: string) {
    const candidate = slugify(supplied);
    if (await this.pages.slugExists(candidate)) {
      throw new ConflictException({
        code: 'SLUG_TAKEN',
        message: `Slug "${candidate}" is in use.`,
      });
    }
    return candidate;
  }
}
