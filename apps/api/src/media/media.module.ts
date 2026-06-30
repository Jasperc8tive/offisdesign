import { Module } from '@nestjs/common';
import { MediaRepository } from './media.repository';
import { MediaApplicationService } from './media.app';
import { AdminMediaController } from './media.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminMediaController],
  providers: [MediaRepository, MediaApplicationService],
  exports: [MediaApplicationService, MediaRepository],
})
export class MediaModule {}
