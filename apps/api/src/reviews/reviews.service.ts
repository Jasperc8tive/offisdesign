import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewStatus, type Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

export const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(20).max(4000),
});
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(input: SubmitReviewInput, customerId: string) {
    // One published or pending review per customer per product.
    const existing = await this.prisma.productReview.findFirst({
      where: {
        productId: input.productId,
        customerId,
        status: { in: [ReviewStatus.PENDING, ReviewStatus.PUBLISHED] },
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException({
        code: 'REVIEW_EXISTS',
        message: 'You have already reviewed this product.',
      });
    }
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException();

    const verifiedPurchase = await this.hasPurchased(customerId, input.productId);

    return this.prisma.productReview.create({
      data: {
        id: uuidv7(),
        productId: input.productId,
        customerId,
        rating: input.rating,
        ...(input.title ? { title: input.title } : {}),
        body: input.body,
        verifiedPurchase,
        status: ReviewStatus.PUBLISHED,
      },
    });
  }

  list(productId: string, params: { page: number; pageSize: number }) {
    const where: Prisma.ProductReviewWhereInput = {
      productId,
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
    };
    return Promise.all([
      this.prisma.productReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.productReview.count({ where }),
    ]);
  }

  async summary(productId: string) {
    const grouped = await this.prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId, status: ReviewStatus.PUBLISHED, deletedAt: null },
      _count: { rating: true },
    });
    let total = 0;
    let sum = 0;
    const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of grouped) {
      const count = row._count.rating;
      const rating = row.rating;
      total += count;
      sum += rating * count;
      buckets[rating] = count;
    }
    return {
      count: total,
      average: total === 0 ? 0 : Number((sum / total).toFixed(2)),
      buckets,
    };
  }

  async vote(reviewId: string, customerId: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });
    if (!review || review.deletedAt) throw new NotFoundException();
    try {
      await this.prisma.reviewHelpfulVote.create({
        data: { reviewId, customerId },
      });
      await this.prisma.productReview.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      });
      return { voted: true };
    } catch (err) {
      // Unique constraint on (reviewId, customerId) — already voted.
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        throw new BadRequestException({ code: 'ALREADY_VOTED' });
      }
      throw err;
    }
  }

  private async hasPurchased(customerId: string, productId: string): Promise<boolean> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    if (variants.length === 0) return false;
    const variantIds = variants.map((v) => v.id);
    const count = await this.prisma.orderItem.count({
      where: {
        variantId: { in: variantIds },
        order: { customerId, status: { in: ['PAID', 'FULFILLING', 'SHIPPED', 'COMPLETED'] } },
      },
    });
    return count > 0;
  }
}
