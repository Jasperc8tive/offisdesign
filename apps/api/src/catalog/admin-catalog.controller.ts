import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CatalogApplicationService } from './catalog.app';
import {
  createProductSchema,
  type CreateProductInput,
  createVariantSchema,
  type CreateVariantInput,
  listProductsQuerySchema,
  type ListProductsQuery,
  updateProductSchema,
  type UpdateProductInput,
  updateVariantSchema,
  type UpdateVariantInput,
} from './dto/product.dto';
import { collectionInputSchema, type CollectionInput } from './collection.domain';
import { categoryInputSchema, type CategoryInput } from './category.domain';
import { paginationSchema } from '../common/pagination';
import type { Principal } from '../auth/principal';

@ApiTags('catalog (admin)')
@Controller('v1/admin/catalog')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminCatalogController {
  constructor(private readonly app: CatalogApplicationService) {}

  // ── Products ──────────────────────────────────────────────────────────

  @Get('products')
  @RequirePermissions('catalog:read')
  listProducts(@Query(new ZodValidationPipe(listProductsQuerySchema)) query: ListProductsQuery) {
    return this.app.listAdmin(query);
  }

  @Post('products')
  @RequirePermissions('catalog:write')
  createProduct(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.createProduct(body, p.id);
  }

  @Patch('products/:id')
  @RequirePermissions('catalog:write')
  updateProduct(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.updateProduct(id, body, p.id);
  }

  @Post('products/:id/publish')
  @RequirePermissions('catalog:write')
  publishProduct(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.publishProduct(id, p.id);
  }

  @Post('products/:id/archive')
  @RequirePermissions('catalog:write')
  archiveProduct(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.archiveProduct(id, p.id);
  }

  @Delete('products/:id')
  @RequirePermissions('catalog:write')
  deleteProduct(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.deleteProduct(id, p.id);
  }

  // ── Variants ──────────────────────────────────────────────────────────

  @Post('products/:productId/variants')
  @RequirePermissions('catalog:write')
  addVariant(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(createVariantSchema)) body: CreateVariantInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.addVariant(productId, body, p.id);
  }

  @Patch('variants/:id')
  @RequirePermissions('catalog:write')
  updateVariant(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVariantSchema)) body: UpdateVariantInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.updateVariant(id, body, p.id);
  }

  @Delete('variants/:id')
  @RequirePermissions('catalog:write')
  deleteVariant(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.deleteVariant(id, p.id);
  }

  // ── Collections ───────────────────────────────────────────────────────

  @Get('collections')
  @RequirePermissions('catalog:read')
  listCollections(@Query() q: unknown) {
    const p = paginationSchema.parse(q);
    return this.app.listCollections(p, true);
  }

  @Post('collections')
  @RequirePermissions('catalog:write')
  createCollection(
    @Body(new ZodValidationPipe(collectionInputSchema)) body: CollectionInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.createCollection(body, p.id);
  }

  @Patch('collections/:id')
  @RequirePermissions('catalog:write')
  updateCollection(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(collectionInputSchema.partial())) body: Partial<CollectionInput>,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.updateCollection(id, body, p.id);
  }

  @Delete('collections/:id')
  @RequirePermissions('catalog:write')
  deleteCollection(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.deleteCollection(id, p.id);
  }

  @Post('collections/:collectionId/products/:productId')
  @RequirePermissions('catalog:write')
  attachToCollection(
    @Param('collectionId') collectionId: string,
    @Param('productId') productId: string,
  ) {
    return this.app.attachProductToCollection(productId, collectionId);
  }

  @Delete('collections/:collectionId/products/:productId')
  @RequirePermissions('catalog:write')
  detachFromCollection(
    @Param('collectionId') collectionId: string,
    @Param('productId') productId: string,
  ) {
    return this.app.detachProductFromCollection(productId, collectionId);
  }

  // ── Categories ────────────────────────────────────────────────────────

  @Get('categories')
  @RequirePermissions('catalog:read')
  listCategories() {
    return this.app.listCategories();
  }

  @Post('categories')
  @RequirePermissions('catalog:write')
  createCategory(
    @Body(new ZodValidationPipe(categoryInputSchema)) body: CategoryInput,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.createCategory(body, p.id);
  }

  @Patch('categories/:id')
  @RequirePermissions('catalog:write')
  updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(categoryInputSchema.partial())) body: Partial<CategoryInput>,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.app.updateCategory(id, body, p.id);
  }

  @Delete('categories/:id')
  @RequirePermissions('catalog:write')
  deleteCategory(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    return this.app.deleteCategory(id, p.id);
  }
}
