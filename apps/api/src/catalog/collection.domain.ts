import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { CollectionRepository } from './collection.repository';
import { slugify, uniqueSlug } from '../common/slug';

export const collectionInputSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).optional(),
  description: z.string().max(5_000).optional(),
  isVisible: z.boolean().default(true),
  position: z.number().int().min(0).default(0),
});
export type CollectionInput = z.infer<typeof collectionInputSchema>;

@Injectable()
export class CollectionDomainService {
  constructor(private readonly collections: CollectionRepository) {}

  async create(input: CollectionInput) {
    const slug = input.slug
      ? await this.ensureFreshSlug(input.slug)
      : await uniqueSlug(input.name, (s) => this.collections.slugExists(s));
    return this.collections.create({
      id: uuidv7(),
      slug,
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      isVisible: input.isVisible,
      position: input.position,
    });
  }

  async update(id: string, input: Partial<CollectionInput>) {
    const existing = await this.collections.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const nextSlug =
      input.slug && slugify(input.slug) !== existing.slug
        ? await this.ensureFreshSlug(input.slug)
        : undefined;
    return this.collections.update(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    });
  }

  async delete(id: string) {
    const existing = await this.collections.findById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.collections.softDelete(id);
  }

  private async ensureFreshSlug(supplied: string): Promise<string> {
    const candidate = slugify(supplied);
    if (await this.collections.slugExists(candidate)) {
      throw new ConflictException({
        code: 'SLUG_TAKEN',
        message: `Slug "${candidate}" is already used.`,
      });
    }
    return candidate;
  }
}
