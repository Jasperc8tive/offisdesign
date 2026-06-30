import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { StorefrontReviewsController } from './storefront-reviews.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StorefrontReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
