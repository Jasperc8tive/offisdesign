import { Module } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { VariantRepository } from './variant.repository';
import { CollectionRepository } from './collection.repository';
import { CategoryRepository } from './category.repository';
import { TagRepository } from './tag.repository';
import { ProductDomainService } from './product.domain';
import { CollectionDomainService } from './collection.domain';
import { CategoryDomainService } from './category.domain';
import { CatalogApplicationService } from './catalog.app';
import { AdminCatalogController } from './admin-catalog.controller';
import { StorefrontCatalogController } from './storefront-catalog.controller';

@Module({
  controllers: [AdminCatalogController, StorefrontCatalogController],
  providers: [
    ProductRepository,
    VariantRepository,
    CollectionRepository,
    CategoryRepository,
    TagRepository,
    ProductDomainService,
    CollectionDomainService,
    CategoryDomainService,
    CatalogApplicationService,
  ],
  exports: [ProductRepository, CollectionRepository, CategoryRepository, CatalogApplicationService],
})
export class CatalogModule {}
