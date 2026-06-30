import { Module } from '@nestjs/common';
import { WebhooksRepository } from './webhooks.repository';
import { WebhooksAppService } from './webhooks.app';
import { AdminWebhooksController } from './admin-webhooks.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminWebhooksController],
  providers: [WebhooksRepository, WebhooksAppService],
  exports: [WebhooksAppService],
})
export class WebhooksModule {}
