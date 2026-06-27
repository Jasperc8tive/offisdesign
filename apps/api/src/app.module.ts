import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { PricingModule } from './pricing/pricing.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TaxModule } from './tax/tax.module';
import { ShippingModule } from './shipping/shipping.module';
import { PaymentsModule } from './payments/payments.module';
import { CustomerModule } from './customer/customer.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { CmsModule } from './cms/cms.module';
import { MediaModule } from './media/media.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { OpsModule } from './ops/ops.module';
import { AuditModule } from './audit/audit.module';
import { MarketingModule } from './marketing/marketing.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { JobsModule } from './jobs/jobs.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { RequestIdMiddleware } from './common/request-id.middleware';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    QueueModule,
    StorageModule,
    NotificationsModule,
    RbacModule,
    AuthModule,
    EventsModule,
    AuditModule,
    CatalogModule,
    InventoryModule,
    PricingModule,
    TaxModule,
    ShippingModule,
    PaymentsModule,
    SearchModule,
    CustomerModule,
    CartModule,
    CheckoutModule,
    CmsModule,
    MediaModule,
    WebhooksModule,
    OpsModule,
    MarketingModule,
    ReviewsModule,
    WishlistModule,
    JobsModule,
    HealthModule,
  ],
  providers: [
    // Order matters: Prisma filter catches first, falling through to the catch-all.
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
