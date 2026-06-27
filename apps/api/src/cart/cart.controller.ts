import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { uuidv7 } from 'uuidv7';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CartApplicationService } from './cart.app';
import {
  addItemSchema,
  type AddItemInput,
  applyCouponSchema,
  type ApplyCouponInput,
  updateItemSchema,
  type UpdateItemInput,
} from './dto/cart.dto';
import { TokenService } from '../auth/token.service';
import { ACCESS_COOKIE } from '../auth/cookie.helper';

const ANON_COOKIE = 'offis_cart_anon';

@ApiTags('cart')
@Controller('v1/cart')
export class CartController {
  constructor(
    private readonly app: CartApplicationService,
    private readonly tokens: TokenService,
  ) {}

  @Get()
  async current(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ctx = this.context(req, res);
    return this.app.resolveOrCreate(ctx);
  }

  @Post('items')
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(addItemSchema)) body: AddItemInput,
  ) {
    const ctx = this.context(req, res);
    const view = await this.app.resolveOrCreate(ctx);
    return this.app.addItem(view.cart.id, body.variantId, body.quantity);
  }

  @Patch('items/:variantId')
  async updateItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('variantId') variantId: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: UpdateItemInput,
  ) {
    const view = await this.app.resolveOrCreate(this.context(req, res));
    return this.app.updateItem(view.cart.id, variantId, body.quantity);
  }

  @Delete('items/:variantId')
  async removeItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('variantId') variantId: string,
  ) {
    const view = await this.app.resolveOrCreate(this.context(req, res));
    return this.app.removeItem(view.cart.id, variantId);
  }

  @Delete()
  async clear(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const view = await this.app.resolveOrCreate(this.context(req, res));
    return this.app.clear(view.cart.id);
  }

  @Post('coupon')
  async applyCoupon(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(applyCouponSchema)) body: ApplyCouponInput,
  ) {
    const view = await this.app.resolveOrCreate(this.context(req, res));
    return this.app.applyCoupon(view.cart.id, body.code);
  }

  /**
   * Merge the anonymous cart from the cookie into the authenticated customer's
   * active cart. Called after sign-in by the storefront. Idempotent.
   */
  @Post('merge')
  async merge(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const principal = this.principalFromAccess(req);
    if (!principal || principal.kind !== 'customer') {
      return { merged: false };
    }
    const anonymousId = req.cookies?.[ANON_COOKIE] as string | undefined;
    if (!anonymousId) return { merged: false };
    const customerCart = await this.app.resolveOrCreate({ customerId: principal.id });
    const anonCart = await this.app.resolveOrCreate({ anonymousId });
    if (anonCart.cart.id === customerCart.cart.id) return { merged: false };
    const view = await this.app.merge(anonCart.cart.id, customerCart.cart.id, principal.id);
    // Anonymous cookie no longer needed.
    res.clearCookie(ANON_COOKIE, { path: '/' });
    return view ?? { merged: false };
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  /**
   * Resolve the cart owner. Authenticated customer takes precedence; otherwise
   * fall back to the anonymous cookie (issuing one if it doesn't exist).
   */
  private context(req: Request, res: Response): { customerId?: string; anonymousId?: string } {
    const principal = this.principalFromAccess(req);
    if (principal && principal.kind === 'customer') {
      return { customerId: principal.id };
    }
    let anon = req.cookies?.[ANON_COOKIE] as string | undefined;
    if (!anon) {
      anon = uuidv7();
      res.cookie(ANON_COOKIE, anon, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
    }
    return { anonymousId: anon };
  }

  private principalFromAccess(req: Request): { id: string; kind: 'admin' | 'customer' } | null {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) return null;
    try {
      const payload = this.tokens.verifyAccess(token);
      return { id: payload.sub, kind: payload.kind };
    } catch {
      return null;
    }
  }
}
