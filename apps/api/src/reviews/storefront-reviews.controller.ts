import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { paginationSchema } from '../common/pagination';
import { ReviewsService, submitReviewSchema, type SubmitReviewInput } from './reviews.service';
import type { Principal } from '../auth/principal';

@ApiTags('reviews (storefront)')
@Controller('v1/storefront/reviews')
export class StorefrontReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('products/:productId')
  async list(@Param('productId') productId: string, @Query() q: unknown) {
    const p = paginationSchema.parse(q);
    const [data, total] = await this.reviews.list(productId, p);
    return { data, total, page: p.page, pageSize: p.pageSize };
  }

  @Get('products/:productId/summary')
  summary(@Param('productId') productId: string) {
    return this.reviews.summary(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(
    @Body(new ZodValidationPipe(submitReviewSchema)) body: SubmitReviewInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.reviews.submit(body, p.id);
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  vote(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.reviews.vote(id, p.id);
  }
}
