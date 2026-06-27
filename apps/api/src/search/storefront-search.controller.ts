import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SEARCH_SERVICE, type SearchService } from './search.interface';

const searchQuerySchema = z.object({
  q: z.string().optional(),
  collection: z.array(z.string()).or(z.string()).optional(),
  category: z.array(z.string()).or(z.string()).optional(),
  tag: z.array(z.string()).or(z.string()).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['relevance', 'recent', 'price-asc', 'price-desc']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
type SearchQueryInput = z.infer<typeof searchQuerySchema>;

const autocompleteSchema = z.object({
  q: z.string().min(2),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

@ApiTags('search (storefront)')
@Controller('v1/storefront/search')
export class StorefrontSearchController {
  constructor(@Inject(SEARCH_SERVICE) private readonly search: SearchService) {}

  @Get()
  query(@Query(new ZodValidationPipe(searchQuerySchema)) q: SearchQueryInput) {
    return this.search.search({
      ...(q.q ? { q: q.q } : {}),
      filters: {
        ...(q.collection ? { collectionSlugs: [].concat(q.collection as never) } : {}),
        ...(q.category ? { categorySlugs: [].concat(q.category as never) } : {}),
        ...(q.tag ? { tagSlugs: [].concat(q.tag as never) } : {}),
        ...(q.priceMin !== undefined ? { priceMin: q.priceMin } : {}),
        ...(q.priceMax !== undefined ? { priceMax: q.priceMax } : {}),
      },
      sort: q.sort,
      page: q.page,
      pageSize: q.pageSize,
    });
  }

  @Get('autocomplete')
  autocomplete(
    @Query(new ZodValidationPipe(autocompleteSchema)) q: z.infer<typeof autocompleteSchema>,
  ) {
    return this.search.autocomplete(q.q, q.limit);
  }
}
