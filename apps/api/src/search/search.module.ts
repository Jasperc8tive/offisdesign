import { Module } from '@nestjs/common';
import { PostgresSearchService } from './postgres-search.service';
import { StorefrontSearchController } from './storefront-search.controller';
import { SEARCH_SERVICE } from './search.interface';

@Module({
  controllers: [StorefrontSearchController],
  providers: [
    PostgresSearchService,
    { provide: SEARCH_SERVICE, useExisting: PostgresSearchService },
  ],
  exports: [SEARCH_SERVICE],
})
export class SearchModule {}
