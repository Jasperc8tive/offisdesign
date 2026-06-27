import { Module } from '@nestjs/common';
import { DiscountRepository } from './discount.repository';
import { PromotionEngineService } from './promotion-engine.service';
import { PricingApplicationService } from './pricing.app';
import { AdminPricingController } from './admin-pricing.controller';

@Module({
  controllers: [AdminPricingController],
  providers: [DiscountRepository, PromotionEngineService, PricingApplicationService],
  exports: [PricingApplicationService, PromotionEngineService],
})
export class PricingModule {}
