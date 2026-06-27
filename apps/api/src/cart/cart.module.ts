import { Module } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { CartDomainService } from './cart.domain';
import { CartApplicationService } from './cart.app';
import { CartController } from './cart.controller';
import { AuthModule } from '../auth/auth.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [AuthModule, PricingModule],
  controllers: [CartController],
  providers: [CartRepository, CartDomainService, CartApplicationService],
  exports: [CartRepository, CartApplicationService],
})
export class CartModule {}
