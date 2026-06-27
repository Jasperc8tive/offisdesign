import { Module } from '@nestjs/common';
import { MediaRepository } from './media.repository';
import { MediaApplicationService } from './media.app';
import { AdminMediaController } from './media.controller';

@Module({
  controllers: [AdminMediaController],
  providers: [MediaRepository, MediaApplicationService],
  exports: [MediaApplicationService, MediaRepository],
})
export class MediaModule {}
