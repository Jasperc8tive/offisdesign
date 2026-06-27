import { Module } from '@nestjs/common';
import { CheckoutRepository } from './checkout.repository';
import { OrderRepository } from './order.repository';
import { CheckoutDomainService } from './checkout.domain';
import { CheckoutApplicationService } from './checkout.app';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';
import { PricingModule } from '../pricing/pricing.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';
import { IdempotencyService } from '../common/idempotency.service';

@Module({
  imports: [CartModule, PricingModule, InventoryModule, AuthModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutRepository,
    OrderRepository,
    CheckoutDomainService,
    CheckoutApplicationService,
    IdempotencyService,
  ],
  exports: [CheckoutApplicationService, OrderRepository],
})
export class CheckoutModule {}
