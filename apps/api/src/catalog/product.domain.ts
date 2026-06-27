import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { ProductRepository } from './product.repository';
import { VariantRepository } from './variant.repository';
import { slugify, uniqueSlug } from '../common/slug';
import type {
  CreateProductInput,
  CreateVariantInput,
  UpdateProductInput,
  UpdateVariantInput,
} from './dto/product.dto';

/**
 * Catalogue domain layer: pure business rules, no HTTP, no caching, no events.
 * Transactions are exposed through the repository's PrismaService. Higher
 * layers (Application Service) are responsible for orchestration like event
 * emission and cache invalidation.
 */
@Injectable()
export class ProductDomainService {
  constructor(
    private readonly products: ProductRepository,
    private readonly variants: VariantRepository,
  ) {}

  async create(input: CreateProductInput) {
    const slug = input.slug
      ? await this.ensureFreshSlug(input.slug)
      : await uniqueSlug(input.name, (s) => this.products.slugExists(s));

    return this.products.create({
      id: uuidv7(),
      slug,
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      ...(input.brand ? { brand: input.brand } : {}),
      status: input.status,
      ...(input.status === 'ACTIVE' ? { publishedAt: new Date() } : {}),
    });
  }

  async update(id: string, input: UpdateProductInput) {
    const existing = await this.products.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (existing.version !== input.version) {
      throw new ConflictException({
        code: 'STALE_VERSION',
        message: 'Product was modified by another writer; reload and retry.',
        details: { currentVersion: existing.version, suppliedVersion: input.version },
      });
    }

    const nextSlug =
      input.slug && slugify(input.slug) !== existing.slug
        ? await this.ensureFreshSlug(input.slug)
        : undefined;

    const data: Parameters<typeof this.products.update>[2] = {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.status === 'ACTIVE' && !existing.publishedAt ? { publishedAt: new Date() } : {}),
    };

    const updated = await this.products.update(id, input.version, data);
    if (!updated) {
      throw new ConflictException({
        code: 'STALE_VERSION',
        message: 'Concurrent update detected.',
      });
    }
    return updated;
  }

  async publish(id: string) {
    const existing = await this.products.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (existing.status === 'ACTIVE') return existing;
    if (!existing.variants || existing.variants.length === 0) {
      throw new BadRequestException({
        code: 'NO_VARIANTS',
        message: 'Cannot publish a product with no variants.',
      });
    }
    const updated = await this.products.update(id, existing.version, {
      status: 'ACTIVE',
      publishedAt: existing.publishedAt ?? new Date(),
    });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async archive(id: string) {
    const existing = await this.products.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    const updated = await this.products.update(id, existing.version, { status: 'ARCHIVED' });
    if (!updated) throw new ConflictException();
    return updated;
  }

  async softDelete(id: string) {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.products.softDelete(id);
  }

  // ── Variants ──────────────────────────────────────────────────────────

  async addVariant(productId: string, input: CreateVariantInput) {
    const product = await this.products.findById(productId);
    if (!product || product.deletedAt) throw new NotFoundException();
    if (await this.variants.skuExists(input.sku)) {
      throw new ConflictException({
        code: 'SKU_TAKEN',
        message: `SKU ${input.sku} is already in use.`,
      });
    }
    if (input.compareAtAmount !== undefined && input.compareAtAmount < input.priceAmount) {
      throw new BadRequestException({
        code: 'COMPARE_AT_LOWER',
        message: 'compareAtAmount must be greater than priceAmount.',
      });
    }
    const variant = await this.variants.create({
      id: uuidv7(),
      product: { connect: { id: productId } },
      sku: input.sku,
      ...(input.name ? { name: input.name } : {}),
      ...(input.barcode ? { barcode: input.barcode } : {}),
      priceAmount: input.priceAmount,
      priceCurrency: input.priceCurrency,
      ...(input.compareAtAmount !== undefined ? { compareAtAmount: input.compareAtAmount } : {}),
      ...(input.weightGrams !== undefined ? { weightGrams: input.weightGrams } : {}),
      isDefault: input.isDefault,
      ...(input.optionValueIds.length > 0
        ? {
            options: {
              create: input.optionValueIds.map((optionValueId) => ({
                optionValue: { connect: { id: optionValueId } },
              })),
            },
          }
        : {}),
    });
    return variant;
  }

  async updateVariant(id: string, input: UpdateVariantInput) {
    const existing = await this.variants.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundException();
    if (input.sku && input.sku !== existing.sku && (await this.variants.skuExists(input.sku))) {
      throw new ConflictException({
        code: 'SKU_TAKEN',
        message: `SKU ${input.sku} is already in use.`,
      });
    }
    const updated = await this.variants.update(id, {
      ...(input.sku ? { sku: input.sku } : {}),
      ...(input.name !== undefined ? { name: input.name ?? null } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode ?? null } : {}),
      ...(input.priceAmount !== undefined ? { priceAmount: input.priceAmount } : {}),
      ...(input.priceCurrency ? { priceCurrency: input.priceCurrency } : {}),
      ...(input.compareAtAmount !== undefined ? { compareAtAmount: input.compareAtAmount } : {}),
      ...(input.weightGrams !== undefined ? { weightGrams: input.weightGrams } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    });
    if (input.optionValueIds) {
      await this.variants.replaceOptionValues(id, input.optionValueIds);
    }
    return updated;
  }

  async deleteVariant(id: string) {
    const existing = await this.variants.findById(id);
    if (!existing) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.variants.softDelete(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async ensureFreshSlug(supplied: string): Promise<string> {
    const candidate = slugify(supplied);
    if (await this.products.slugExists(candidate)) {
      throw new ConflictException({
        code: 'SLUG_TAKEN',
        message: `Slug "${candidate}" is already used.`,
      });
    }
    return candidate;
  }
}
