import { Module } from '@nestjs/common';
import { PageRepository } from './page.repository';
import { BlogRepository } from './blog.repository';
import { AncillaryRepository } from './ancillary.repository';
import { PageDomainService } from './page.domain';
import { BlogDomainService } from './blog.domain';
import { CmsApplicationService } from './cms.app';
import { AdminCmsController } from './admin-cms.controller';
import { StorefrontCmsController } from './storefront-cms.controller';

@Module({
  controllers: [AdminCmsController, StorefrontCmsController],
  providers: [
    PageRepository,
    BlogRepository,
    AncillaryRepository,
    PageDomainService,
    BlogDomainService,
    CmsApplicationService,
  ],
  exports: [CmsApplicationService, PageRepository, BlogRepository],
})
export class CmsModule {}
