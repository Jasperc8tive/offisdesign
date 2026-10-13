import {
  BadRequestException,
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
import { SessionService } from '../auth/session.service';
import { ACCESS_COOKIE } from '../auth/cookie.helper';
import { CartApplicationService } from '../cart/cart.app';
import { CheckoutApplicationService, type CheckoutOwner } from './checkout.app';
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

const ANON_CART_COOKIE = 'offis_cart_anon';

@ApiTags('checkout')
@Controller('v1/checkout')
export class CheckoutController {
  constructor(
    private readonly app: CheckoutApplicationService,
    private readonly carts: CartApplicationService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  async start(
    @Req() req: Request,
    @Body(new ZodValidationPipe(startCheckoutSchema)) body: StartCheckoutInput,
  ) {
    const owner = await this.owner(req);
    const cartOwner = owner.customerId
      ? { customerId: owner.customerId }
      : owner.anonymousId
        ? { anonymousId: owner.anonymousId }
        : null;
    if (!cartOwner) {
      // No account and no cart cookie: there is no cart of theirs to check out.
      throw new BadRequestException({ code: 'NO_CART', message: 'Your cart is empty.' });
    }
    const cartView = await this.carts.resolveOrCreate(cartOwner);
    await this.carts.attachEmail(cartView.cart.id, body.email);
    return this.app.start(cartView.cart.id, body.email, owner.customerId);
  }

  @Post(':id/shipping-address')
  async shippingAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setAddressSchema)) body: SetAddressInput,
  ) {
    await this.app.assertAccess(id, await this.owner(req));
    return this.app.setShippingAddress(id, body);
  }

  @Post(':id/billing-address')
  async billingAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setAddressSchema)) body: SetAddressInput,
  ) {
    await this.app.assertAccess(id, await this.owner(req));
    return this.app.setBillingAddress(id, body);
  }

  @Get(':id/shipping-rates')
  async shippingRates(@Req() req: Request, @Param('id') id: string) {
    await this.app.assertAccess(id, await this.owner(req));
    return this.app.getShippingRates(id);
  }

  @Post(':id/shipping-method')
  async shippingMethod(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setShippingMethodSchema)) body: SetShippingMethodInput,
  ) {
    await this.app.assertAccess(id, await this.owner(req));
    return this.app.setShippingMethod(id, body);
  }

  @Post(':id/review')
  async review(@Req() req: Request, @Param('id') id: string) {
    await this.app.assertAccess(id, await this.owner(req));
    return this.app.computeReview(id);
  }

  @Post(':id/payment-intent')
  async paymentIntent(@Req() req: Request, @Param('id') id: string) {
    await this.app.assertAccess(id, await this.owner(req));
    return this.app.createPaymentIntent(id);
  }

  /**
   * Idempotent — `placeOrder` serializes per session and replays the existing
   * order once COMPLETED. The `Idempotency-Key` cache is scoped to the session
   * so a key reused from another checkout can never replay that order.
   */
  @Post(':id/place')
  async place(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(placeOrderSchema)) body: PlaceOrderInput,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    await this.app.assertAccess(id, await this.owner(req));
    const key = `place:${id}:${idempotencyKey ?? 'auto'}`;
    return this.idempotency.run(key, body, 201, () =>
      this.app.placeOrder(id, body.paymentIntentRef),
    );
  }

  // Orders (customer)
  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async listOrders(@CurrentPrincipal() p: Principal, @Query() q: unknown) {
    const page = paginationSchema.parse(q);
    return this.app.listOrders(p.id, page.page, page.pageSize);
  }

  /**
   * Customers read their own orders; guests read the order their cart cookie
   * placed (so a guest can reload the confirmation page). Anything else is 404.
   */
  @Get('orders/:id')
  async getOrder(@Req() req: Request, @Param('id') id: string) {
    const order = await this.app.getOrder(id, await this.owner(req));
    if (!order) throw new NotFoundException();
    return order;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  /**
   * Who is asking: the signed-in customer (only while their session is still
   * active) and/or the anonymous cart cookie.
   */
  private async owner(req: Request): Promise<CheckoutOwner> {
    const anonymousId = req.cookies?.[ANON_CART_COOKIE] as string | undefined;
    const customerId = await this.customerId(req);
    return {
      ...(anonymousId ? { anonymousId } : {}),
      ...(customerId ? { customerId } : {}),
    };
  }

  private async customerId(req: Request): Promise<string | null> {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) return null;
    try {
      const payload = this.tokens.verifyAccess(token);
      if (payload.kind !== 'customer') return null;
      const state = await this.sessions.state('customer', payload.sid);
      return state.active ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
