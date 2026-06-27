import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CmsApplicationService } from './cms.app';
import { paginationSchema } from '../common/pagination';

@ApiTags('cms (storefront)')
@Controller('v1/storefront/cms')
export class StorefrontCmsController {
  constructor(private readonly app: CmsApplicationService) {}

  @Get('pages/:slug')
  async page(@Param('slug') slug: string) {
    const page = await this.app.getPublicPage(slug);
    if (!page) throw new NotFoundException();
    return page;
  }

  @Get('posts')
  listPosts(@Query() q: unknown) {
    const p = paginationSchema.parse(q);
    return this.app.listPosts({
      status: 'PUBLISHED',
      page: p.page,
      pageSize: p.pageSize,
    });
  }

  @Get('posts/:slug')
  async post(@Param('slug') slug: string) {
    const post = await this.app.getPublicPost(slug);
    if (!post) throw new NotFoundException();
    return post;
  }

  @Get('navigation/:key')
  async navigation(@Param('key') key: string) {
    const nav = await this.app.getPublicNavigation(key);
    if (!nav) throw new NotFoundException();
    return nav;
  }

  @Get('announcements')
  announcements() {
    return this.app.listPublicAnnouncements();
  }

  @Get('testimonials')
  testimonials() {
    return this.app.listPublicTestimonials();
  }

  @Get('faqs')
  faqs() {
    return this.app.listPublicFaqs();
  }
}
