import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { StorefrontReviewsController } from './storefront-reviews.controller';

@Module({
  controllers: [StorefrontReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
