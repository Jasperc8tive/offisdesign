import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CmsStatus, type Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { BlogRepository } from './blog.repository';
import { slugify, uniqueSlug } from '../common/slug';
import type { AuthorInput, BlogPostInput, BlogPostPatch } from './dto/cms.dto';

@Injectable()
export class BlogDomainService {
  constructor(private readonly repo: BlogRepository) {}

  async createPost(input: BlogPostInput) {
    const slug = input.slug
      ? await this.ensurePostSlug(input.slug)
      : await uniqueSlug(input.title, (s) => this.repo.postSlugExists(s));
    return this.repo.createPost({
      id: uuidv7(),
      slug,
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      body: input.body,
      ...(input.coverMediaId ? { coverMediaId: input.coverMediaId } : {}),
      ...(input.authorId ? { author: { connect: { id: input.authorId } } } : {}),
      status: input.status,
      ...(input.seo ? { seo: input.seo as Prisma.InputJsonValue } : {}),
      ...(input.status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      ...(input.scheduledAt ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.unscheduledAt ? { unscheduledAt: input.unscheduledAt } : {}),
      tags: input.tags,
    });
  }

  async updatePost(id: string, input: BlogPostPatch) {
    const existing = await this.repo.findPostById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (existing.version !== input.version) {
      throw new ConflictException({ code: 'STALE_VERSION' });
    }
    const nextSlug =
      input.slug && slugify(input.slug) !== existing.slug
        ? await this.ensurePostSlug(input.slug)
        : undefined;
    const data: Prisma.BlogPostUpdateInput = {
      ...(input.title ? { title: input.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt ?? null } : {}),
      ...(input.body ? { body: input.body } : {}),
      ...(input.coverMediaId !== undefined ? { coverMediaId: input.coverMediaId ?? null } : {}),
      ...(input.authorId !== undefined
        ? input.authorId
          ? { author: { connect: { id: input.authorId } } }
          : { author: { disconnect: true } }
        : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.seo !== undefined ? { seo: input.seo as Prisma.InputJsonValue } : {}),
      ...(input.status === 'PUBLISHED' && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt ?? null } : {}),
      ...(input.unscheduledAt !== undefined ? { unscheduledAt: input.unscheduledAt ?? null } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    };
    const updated = await this.repo.updatePost(id, input.version, data);
    if (!updated) throw new ConflictException();
    return updated;
  }

  async publishPost(id: string) {
    const existing = await this.repo.findPostById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (existing.status === CmsStatus.PUBLISHED) return existing;
    const updated = await this.repo.updatePost(id, existing.version, {
      status: CmsStatus.PUBLISHED,
      publishedAt: existing.publishedAt ?? new Date(),
      scheduledAt: null,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async unpublishPost(id: string) {
    const existing = await this.repo.findPostById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const updated = await this.repo.updatePost(id, existing.version, {
      status: CmsStatus.DRAFT,
      unscheduledAt: null,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async schedulePost(id: string, scheduledAt: Date) {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException({ code: 'SCHEDULE_IN_PAST' });
    }
    const existing = await this.repo.findPostById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const updated = await this.repo.updatePost(id, existing.version, {
      status: CmsStatus.SCHEDULED,
      scheduledAt,
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async deletePost(id: string) {
    const existing = await this.repo.findPostById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.repo.softDeletePost(id);
  }

  // ── Authors ───────────────────────────────────────────────────────────

  async createAuthor(input: AuthorInput) {
    const slug = input.slug
      ? await this.ensureAuthorSlug(input.slug)
      : await uniqueSlug(input.name, (s) => this.repo.authorSlugExists(s));
    return this.repo.createAuthor({
      id: uuidv7(),
      slug,
      name: input.name,
      ...(input.bio ? { bio: input.bio } : {}),
      ...(input.avatarMediaId ? { avatarMediaId: input.avatarMediaId } : {}),
    });
  }

  async updateAuthor(id: string, input: Partial<AuthorInput>) {
    const existing = await this.repo.findAuthorById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    return this.repo.updateAuthor(id, {
      ...(input.slug ? { slug: slugify(input.slug) } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.bio !== undefined ? { bio: input.bio ?? null } : {}),
      ...(input.avatarMediaId !== undefined ? { avatarMediaId: input.avatarMediaId ?? null } : {}),
    });
  }

  async deleteAuthor(id: string) {
    const existing = await this.repo.findAuthorById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.repo.softDeleteAuthor(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async ensurePostSlug(supplied: string) {
    const candidate = slugify(supplied);
    if (await this.repo.postSlugExists(candidate)) {
      throw new ConflictException({ code: 'SLUG_TAKEN' });
    }
    return candidate;
  }

  private async ensureAuthorSlug(supplied: string) {
    const candidate = slugify(supplied);
    if (await this.repo.authorSlugExists(candidate)) {
      throw new ConflictException({ code: 'SLUG_TAKEN' });
    }
    return candidate;
  }
}
