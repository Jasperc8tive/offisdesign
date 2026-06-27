import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { TokenService } from '../auth/token.service';
import { ACCESS_COOKIE } from '../auth/cookie.helper';
import { CartApplicationService } from '../cart/cart.app';
import { CheckoutApplicationService } from './checkout.app';
import { IdempotencyService } from '../common/idempotency.service';
import {
  placeOrderSchema,
  setAddressSchema,
  setShippingMethodSchema,
  startCheckoutSchema,
  type PlaceOrderInput,
  type SetAddressInput,
  type SetShippingMethodInput,
  type StartCheckoutInput,
} from './dto/checkout.dto';
import { paginationSchema } from '../common/pagination';
import type { Principal } from '../auth/principal';

@ApiTags('checkout')
@Controller('v1/checkout')
export class CheckoutController {
  constructor(
    private readonly app: CheckoutApplicationService,
    private readonly carts: CartApplicationService,
    private readonly tokens: TokenService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  async start(
    @Req() req: Request,
    @Body(new ZodValidationPipe(startCheckoutSchema)) body: StartCheckoutInput,
  ) {
    const customerId = this.principal(req)?.id;
    const cartView = await this.carts.resolveOrCreate(
      customerId ? { customerId } : { anonymousId: this.anonId(req) },
    );
    await this.carts.attachEmail(cartView.cart.id, body.email);
    return this.app.start(cartView.cart.id, body.email, customerId);
  }

  @Post(':id/shipping-address')
  shippingAddress(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setAddressSchema)) body: SetAddressInput,
  ) {
    return this.app.setShippingAddress(id, body);
  }

  @Post(':id/billing-address')
  billingAddress(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setAddressSchema)) body: SetAddressInput,
  ) {
    return this.app.setBillingAddress(id, body);
  }

  @Get(':id/shipping-rates')
  shippingRates(@Param('id') id: string) {
    return this.app.getShippingRates(id);
  }

  @Post(':id/shipping-method')
  shippingMethod(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setShippingMethodSchema)) body: SetShippingMethodInput,
  ) {
    return this.app.setShippingMethod(id, body);
  }

  @Post(':id/review')
  review(@Param('id') id: string) {
    return this.app.computeReview(id);
  }

  @Post(':id/payment-intent')
  paymentIntent(@Param('id') id: string) {
    return this.app.createPaymentIntent(id);
  }

  /**
   * Idempotent — requires `Idempotency-Key` header. Re-running with the same
   * key returns the stored response; with a different body, returns 409.
   */
  @Post(':id/place')
  async place(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(placeOrderSchema)) body: PlaceOrderInput,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    const key = idempotencyKey ?? `auto:${id}:place`;
    return this.idempotency.run(key, body, 201, () => this.app.placeOrder(id));
  }

  // Orders (customer)
  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async listOrders(@CurrentPrincipal() p: Principal, @Query() q: unknown) {
    const page = paginationSchema.parse(q);
    return this.app.listOrders(p.id, page.page, page.pageSize);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string, @CurrentPrincipal() p: Principal) {
    const order = await this.app.getOrder(id, p.id);
    if (!order) throw new NotFoundException();
    return order;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private principal(req: Request) {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) return null;
    try {
      const payload = this.tokens.verifyAccess(token);
      if (payload.kind !== 'customer') return null;
      return { id: payload.sub };
    } catch {
      return null;
    }
  }

  private anonId(req: Request): string {
    return (
      (req.cookies?.['offis_cart_anon'] as string | undefined) ??
      '00000000-0000-0000-0000-000000000000'
    );
  }
}
