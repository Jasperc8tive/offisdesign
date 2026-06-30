import { Global, Module } from '@nestjs/common';
import { LogEmailAdapter } from './log-email.adapter';
import { EMAIL_ADAPTER } from './notifications.interface';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsAppService } from './notifications.app';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [AdminNotificationsController],
  providers: [
    LogEmailAdapter,
    { provide: EMAIL_ADAPTER, useExisting: LogEmailAdapter },
    NotificationsRepository,
    NotificationsAppService,
  ],
  exports: [EMAIL_ADAPTER, NotificationsAppService, NotificationsRepository],
})
export class NotificationsModule {}
