import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PricingApplicationService } from './pricing.app';
import {
  discountInputSchema,
  discountPatchSchema,
  type DiscountInput,
  type DiscountPatch,
  quoteRequestSchema,
  type QuoteRequest,
} from './dto/pricing.dto';

@ApiTags('pricing (admin)')
@Controller('v1/admin/pricing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminPricingController {
  constructor(private readonly app: PricingApplicationService) {}

  @Get('discounts')
  @RequirePermissions('catalog:read')
  list() {
    return this.app.list();
  }

  @Post('discounts')
  @RequirePermissions('catalog:write')
  create(@Body(new ZodValidationPipe(discountInputSchema)) body: DiscountInput) {
    return this.app.create(body);
  }

  @Patch('discounts/:id')
  @RequirePermissions('catalog:write')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(discountPatchSchema)) body: DiscountPatch,
  ) {
    return this.app.update(id, body);
  }

  @Delete('discounts/:id')
  @RequirePermissions('catalog:write')
  remove(@Param('id') id: string) {
    return this.app.delete(id);
  }

  @Post('quote')
  @RequirePermissions('catalog:read')
  quote(@Body(new ZodValidationPipe(quoteRequestSchema)) body: QuoteRequest) {
    return this.app.quote(body);
  }
}
