import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { StorefrontMarketingController } from './storefront-marketing.controller';

@Module({
  controllers: [StorefrontMarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
