import { Global, Module } from '@nestjs/common';
import { RevisionService } from './revision.service';
import { ActivityService } from './activity.service';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [RevisionService, ActivityService],
  exports: [RevisionService, ActivityService],
})
export class AuditModule {}
