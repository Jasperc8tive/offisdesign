import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { WishlistService } from './wishlist.service';
import type { Principal } from '../auth/principal';

const mergeSchema = z.object({
  productIds: z.array(z.string().uuid()).max(200),
});

@ApiTags('wishlist (customer)')
@Controller('v1/customer/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  list(@CurrentPrincipal() p: Principal) {
    return this.service.list(p.id);
  }

  @Post(':productId')
  add(@Param('productId') productId: string, @CurrentPrincipal() p: Principal) {
    return this.service.add(p.id, productId);
  }

  @Delete(':productId')
  remove(@Param('productId') productId: string, @CurrentPrincipal() p: Principal) {
    return this.service.remove(p.id, productId);
  }

  @Post('merge')
  @HttpCode(200)
  merge(
    @Body(new ZodValidationPipe(mergeSchema)) body: z.infer<typeof mergeSchema>,
    @CurrentPrincipal() p: Principal,
  ) {
    return this.service.merge(p.id, body.productIds);
  }
}
