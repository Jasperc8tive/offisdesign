import { Injectable } from '@nestjs/common';
import { ProductDomainService } from './product.domain';
import { CollectionDomainService } from './collection.domain';
import { CategoryDomainService } from './category.domain';
import { ProductRepository } from './product.repository';
import { CollectionRepository } from './collection.repository';
import { EventBus } from '../events/event-bus.service';
import { CacheService } from '../redis/cache.service';
import {
  type CreateProductInput,
  type CreateVariantInput,
  type ListProductsQuery,
  type UpdateProductInput,
  type UpdateVariantInput,
} from './dto/product.dto';
import { type CollectionInput } from './collection.domain';
import { type CategoryInput } from './category.domain';
import { type Pagination } from '../common/pagination';

const PRODUCT_CACHE_TTL = 60 * 5;
const productCacheKey = (slug: string) => `cat:product:slug:${slug}`;
const collectionCacheKey = (slug: string) => `cat:collection:slug:${slug}`;
const categoryListKey = 'cat:category:tree';

/**
 * Application service — orchestrates domain calls with side effects (events,
 * caching, eventual notifications). Controllers depend only on this layer.
 */
@Injectable()
export class CatalogApplicationService {
  constructor(
    private readonly productDomain: ProductDomainService,
    private readonly collectionDomain: CollectionDomainService,
    private readonly categoryDomain: CategoryDomainService,
    private readonly products: ProductRepository,
    private readonly collections: CollectionRepository,
    private readonly events: EventBus,
    private readonly cache: CacheService,
  ) {}

  // ── Products ──────────────────────────────────────────────────────────

  async createProduct(input: CreateProductInput, actorId?: string) {
    const product = await this.productDomain.create(input);
    await this.events.publish(
      'product.created',
      'product',
      product.id,
      { productId: product.id, slug: product.slug },
      actorId,
    );
    if (product.status === 'ACTIVE') {
      await this.events.publish(
        'product.published',
        'product',
        product.id,
        { productId: product.id, slug: product.slug },
        actorId,
      );
    }
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput, actorId?: string) {
    const before = await this.products.findById(id);
    const product = await this.productDomain.update(id, input);
    await this.cache.del(productCacheKey(product.slug));
    if (before && before.slug !== product.slug) {
      await this.cache.del(productCacheKey(before.slug));
    }
    await this.events.publish(
      'product.updated',
      'product',
      product.id,
      { productId: product.id, slug: product.slug },
      actorId,
    );
    if (before?.status !== 'ACTIVE' && product.status === 'ACTIVE') {
      await this.events.publish(
        'product.published',
        'product',
        product.id,
        { productId: product.id, slug: product.slug },
        actorId,
      );
    }
    if (before?.status !== 'ARCHIVED' && product.status === 'ARCHIVED') {
      await this.events.publish(
        'product.archived',
        'product',
        product.id,
        { productId: product.id, slug: product.slug },
        actorId,
      );
    }
    return product;
  }

  async publishProduct(id: string, actorId?: string) {
    const product = await this.productDomain.publish(id);
    await this.cache.del(productCacheKey(product.slug));
    await this.events.publish(
      'product.published',
      'product',
      product.id,
      { productId: product.id, slug: product.slug },
      actorId,
    );
    return product;
  }

  async archiveProduct(id: string, actorId?: string) {
    const product = await this.productDomain.archive(id);
    await this.cache.del(productCacheKey(product.slug));
    await this.events.publish(
      'product.archived',
      'product',
      product.id,
      { productId: product.id, slug: product.slug },
      actorId,
    );
    return product;
  }

  async deleteProduct(id: string, actorId?: string) {
    const product = await this.productDomain.softDelete(id);
    await this.cache.del(productCacheKey(product.slug));
    await this.events.publish(
      'product.deleted',
      'product',
      product.id,
      { productId: product.id, slug: product.slug },
      actorId,
    );
    return product;
  }

  async addVariant(productId: string, input: CreateVariantInput, actorId?: string) {
    const variant = await this.productDomain.addVariant(productId, input);
    const product = await this.products.findById(productId);
    if (product) await this.cache.del(productCacheKey(product.slug));
    await this.events.publish(
      'product.updated',
      'product',
      productId,
      { productId, slug: product?.slug ?? '' },
      actorId,
    );
    return variant;
  }

  async updateVariant(variantId: string, input: UpdateVariantInput, actorId?: string) {
    const before = await this.products
      .findById((await this.findProductIdForVariant(variantId)) ?? '')
      .catch(() => null);
    const variant = await this.productDomain.updateVariant(variantId, input);

    if (input.priceAmount !== undefined && before) {
      const oldPrice = before.variants.find((v) => v.id === variantId)?.priceAmount;
      if (oldPrice !== undefined && oldPrice !== input.priceAmount) {
        await this.events.publish(
          'price.changed',
          'variant',
          variantId,
          {
            variantId,
            productId: before.id,
            oldAmount: oldPrice,
            newAmount: input.priceAmount,
            currency: input.priceCurrency ?? 'GBP',
          },
          actorId,
        );
      }
    }
    if (before) await this.cache.del(productCacheKey(before.slug));
    return variant;
  }

  async deleteVariant(variantId: string, actorId?: string) {
    const productId = await this.findProductIdForVariant(variantId);
    const variant = await this.productDomain.deleteVariant(variantId);
    if (productId) {
      const product = await this.products.findById(productId);
      if (product) await this.cache.del(productCacheKey(product.slug));
      await this.events.publish(
        'product.updated',
        'product',
        productId,
        { productId, slug: product?.slug ?? '' },
        actorId,
      );
    }
    return variant;
  }

  private async findProductIdForVariant(variantId: string): Promise<string | null> {
    const prisma = (
      this.products as unknown as {
        prisma: {
          productVariant: { findUnique: (args: unknown) => Promise<{ productId: string } | null> };
        };
      }
    ).prisma;
    const v = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    } as never);
    return v?.productId ?? null;
  }

  // ── Storefront reads (cached) ─────────────────────────────────────────

  async listStorefront(query: ListProductsQuery) {
    return this.products.list(
      {
        ...(query.q ? { q: query.q } : {}),
        ...(query.collection ? { collectionSlug: query.collection } : {}),
        ...(query.category ? { categorySlug: query.category } : {}),
        ...(query.tag ? { tagSlug: query.tag } : {}),
        sort: query.sort,
        onlyPublished: true,
      },
      { page: query.page, pageSize: query.pageSize },
    );
  }

  async listAdmin(query: ListProductsQuery) {
    return this.products.list(
      {
        ...(query.q ? { q: query.q } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.collection ? { collectionSlug: query.collection } : {}),
        ...(query.category ? { categorySlug: query.category } : {}),
        ...(query.tag ? { tagSlug: query.tag } : {}),
        sort: query.sort,
        includeDeleted: query.includeDeleted,
      },
      { page: query.page, pageSize: query.pageSize },
    );
  }

  async getProductBySlug(slug: string) {
    const cached = await this.cache.get<unknown>(productCacheKey(slug));
    if (cached) return cached;
    const product = await this.products.findBySlug(slug);
    if (!product || product.deletedAt) return null;
    if (product.status === 'ACTIVE') {
      await this.cache.set(productCacheKey(slug), product, PRODUCT_CACHE_TTL);
    }
    return product;
  }

  // ── Collections / Categories ──────────────────────────────────────────

  async createCollection(input: CollectionInput, actorId?: string) {
    const collection = await this.collectionDomain.create(input);
    await this.events.publish(
      'collection.updated',
      'collection',
      collection.id,
      { collectionId: collection.id, slug: collection.slug },
      actorId,
    );
    return collection;
  }

  async updateCollection(id: string, input: Partial<CollectionInput>, actorId?: string) {
    const collection = await this.collectionDomain.update(id, input);
    await this.cache.del(collectionCacheKey(collection.slug));
    await this.events.publish(
      'collection.updated',
      'collection',
      collection.id,
      { collectionId: collection.id, slug: collection.slug },
      actorId,
    );
    return collection;
  }

  async deleteCollection(id: string, actorId?: string) {
    const collection = await this.collectionDomain.delete(id);
    await this.cache.del(collectionCacheKey(collection.slug));
    await this.events.publish(
      'collection.updated',
      'collection',
      collection.id,
      { collectionId: collection.id, slug: collection.slug },
      actorId,
    );
    return collection;
  }

  async listCollections(p: Pagination, includeHidden = false) {
    return this.collections.list(p, includeHidden);
  }

  async getCollectionBySlug(slug: string) {
    const cached = await this.cache.get<unknown>(collectionCacheKey(slug));
    if (cached) return cached;
    const collection = await this.collections.findBySlug(slug);
    if (!collection || collection.deletedAt || !collection.isVisible) return null;
    await this.cache.set(collectionCacheKey(slug), collection, PRODUCT_CACHE_TTL);
    return collection;
  }

  async attachProductToCollection(productId: string, collectionId: string, position = 0) {
    await this.collections.attach(productId, collectionId, position);
    const collection = await this.collections.findById(collectionId);
    if (collection) await this.cache.del(collectionCacheKey(collection.slug));
  }

  async detachProductFromCollection(productId: string, collectionId: string) {
    await this.collections.detach(productId, collectionId);
    const collection = await this.collections.findById(collectionId);
    if (collection) await this.cache.del(collectionCacheKey(collection.slug));
  }

  async createCategory(input: CategoryInput, actorId?: string) {
    const c = await this.categoryDomain.create(input);
    await this.cache.del(categoryListKey);
    await this.events.publish(
      'category.updated',
      'category',
      c.id,
      { categoryId: c.id, slug: c.slug },
      actorId,
    );
    return c;
  }

  async updateCategory(id: string, input: Partial<CategoryInput>, actorId?: string) {
    const c = await this.categoryDomain.update(id, input);
    await this.cache.del(categoryListKey);
    await this.events.publish(
      'category.updated',
      'category',
      c.id,
      { categoryId: c.id, slug: c.slug },
      actorId,
    );
    return c;
  }

  async deleteCategory(id: string, actorId?: string) {
    const c = await this.categoryDomain.delete(id);
    await this.cache.del(categoryListKey);
    await this.events.publish(
      'category.updated',
      'category',
      c.id,
      { categoryId: c.id, slug: c.slug },
      actorId,
    );
    return c;
  }

  async listCategories() {
    return this.products['prisma'].category.findMany({
      where: { deletedAt: null },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }
}
