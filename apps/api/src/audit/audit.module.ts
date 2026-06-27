import { Global, Module } from '@nestjs/common';
import { RevisionService } from './revision.service';
import { ActivityService } from './activity.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  controllers: [AuditController],
  providers: [RevisionService, ActivityService],
  exports: [RevisionService, ActivityService],
})
export class AuditModule {}
