import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { CategoryRepository } from './category.repository';
import { slugify, uniqueSlug } from '../common/slug';

export const categoryInputSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).optional(),
  parentId: z.string().uuid().nullish(),
  position: z.number().int().min(0).default(0),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

@Injectable()
export class CategoryDomainService {
  constructor(private readonly categories: CategoryRepository) {}

  async create(input: CategoryInput) {
    const slug = input.slug
      ? await this.ensureFreshSlug(input.slug)
      : await uniqueSlug(input.name, (s) => this.categories.slugExists(s));
    return this.categories.create({
      id: uuidv7(),
      slug,
      name: input.name,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
      position: input.position,
    });
  }

  async update(id: string, input: Partial<CategoryInput>) {
    const existing = await this.categories.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (input.parentId === id) {
      throw new ConflictException({
        code: 'INVALID_PARENT',
        message: 'Category cannot be its own parent.',
      });
    }
    return this.categories.update(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.slug ? { slug: slugify(input.slug) } : {}),
      ...(input.parentId !== undefined
        ? input.parentId
          ? { parent: { connect: { id: input.parentId } } }
          : { parent: { disconnect: true } }
        : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    });
  }

  async delete(id: string) {
    const existing = await this.categories.findById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.categories.softDelete(id);
  }

  private async ensureFreshSlug(supplied: string): Promise<string> {
    const candidate = slugify(supplied);
    if (await this.categories.slugExists(candidate)) {
      throw new ConflictException({
        code: 'SLUG_TAKEN',
        message: `Slug "${candidate}" is already used.`,
      });
    }
    return candidate;
  }
}
