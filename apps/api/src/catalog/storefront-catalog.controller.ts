import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CatalogApplicationService } from './catalog.app';
import { listProductsQuerySchema, type ListProductsQuery } from './dto/product.dto';
import { paginationSchema } from '../common/pagination';

@ApiTags('catalog (storefront)')
@Controller('v1/storefront/catalog')
export class StorefrontCatalogController {
  constructor(private readonly app: CatalogApplicationService) {}

  @Get('products')
  listProducts(@Query(new ZodValidationPipe(listProductsQuerySchema)) query: ListProductsQuery) {
    return this.app.listStorefront(query);
  }

  @Get('products/:slug')
  async productBySlug(@Param('slug') slug: string) {
    const product = await this.app.getProductBySlug(slug);
    if (!product) throw new NotFoundException();
    return product;
  }

  @Get('collections')
  listCollections(@Query() q: unknown) {
    const p = paginationSchema.parse(q);
    return this.app.listCollections(p, false);
  }

  @Get('collections/:slug')
  async collectionBySlug(@Param('slug') slug: string) {
    const collection = await this.app.getCollectionBySlug(slug);
    if (!collection) throw new NotFoundException();
    return collection;
  }

  @Get('categories')
  listCategories() {
    return this.app.listCategories();
  }
}
