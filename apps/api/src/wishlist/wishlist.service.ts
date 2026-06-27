import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customerId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { customerId },
      orderBy: { addedAt: 'desc' },
    });
    if (items.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, deletedAt: null },
      include: { variants: { where: { deletedAt: null }, take: 1 } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return items.map((it) => ({
      productId: it.productId,
      addedAt: it.addedAt,
      product: byId.get(it.productId) ?? null,
    }));
  }

  async add(customerId: string, productId: string) {
    await this.prisma.wishlistItem.upsert({
      where: { customerId_productId: { customerId, productId } },
      update: {},
      create: { customerId, productId },
    });
    return { added: true };
  }

  async remove(customerId: string, productId: string) {
    await this.prisma.wishlistItem
      .delete({ where: { customerId_productId: { customerId, productId } } })
      .catch(() => undefined);
    return { removed: true };
  }

  /**
   * Merge an anonymous client wishlist into the server wishlist. Idempotent:
   * existing rows are left in place, new ones inserted. Returns the merged
   * server list so the caller can hydrate state immediately.
   */
  async merge(customerId: string, productIds: string[]) {
    if (productIds.length > 0) {
      await this.prisma.wishlistItem.createMany({
        data: productIds.map((productId) => ({ customerId, productId })),
        skipDuplicates: true,
      });
    }
    return this.list(customerId);
  }
}
