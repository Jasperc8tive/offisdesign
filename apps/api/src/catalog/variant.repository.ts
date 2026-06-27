import { Injectable } from '@nestjs/common';
import { type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.productVariant.findUnique({
      where: { id },
      include: { options: { include: { optionValue: true } } },
    });
  }

  skuExists(sku: string): Promise<boolean> {
    return this.prisma.productVariant
      .findUnique({ where: { sku }, select: { id: true } })
      .then((r) => r != null);
  }

  create(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({
      data,
      include: { options: { include: { optionValue: true } } },
    });
  }

  update(id: string, data: Prisma.ProductVariantUpdateInput) {
    return this.prisma.productVariant.update({
      where: { id },
      data,
      include: { options: { include: { optionValue: true } } },
    });
  }

  softDelete(id: string) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  replaceOptionValues(variantId: string, optionValueIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariantOption.deleteMany({ where: { variantId } });
      if (optionValueIds.length > 0) {
        await tx.productVariantOption.createMany({
          data: optionValueIds.map((optionValueId) => ({ variantId, optionValueId })),
          skipDuplicates: true,
        });
      }
    });
  }
}
