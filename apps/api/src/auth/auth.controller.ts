import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from './cookie.helper';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentPrincipal } from './current-principal.decorator';
import type { Principal } from './principal';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type LoginInput = z.infer<typeof loginSchema>;

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  @Post('admin/login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async loginAdmin(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.loginAdmin({
      ...body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setAuthCookies(
      { res, env: this.env },
      result.accessToken,
      result.refreshToken,
      result.accessTtlSec,
      result.refreshTtlSec,
    );
    return { principal: result.principal };
  }

  @Post('customer/login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async loginCustomer(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.loginCustomer({
      ...body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setAuthCookies(
      { res, env: this.env },
      result.accessToken,
      result.refreshToken,
      result.accessTtlSec,
      result.refreshTtlSec,
    );
    return { principal: result.principal };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new Error('Missing refresh token');
    }
    const result = await this.auth.refresh(refreshToken);
    setAuthCookies(
      { res, env: this.env },
      result.accessToken,
      result.refreshToken,
      result.accessTtlSec,
      result.refreshTtlSec,
    );
    return { principal: result.principal };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    clearAuthCookies({ res, env: this.env });
    return;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentPrincipal() principal: Principal) {
    return { principal };
  }
}

// Re-export cookie names for tests/consumers
export { ACCESS_COOKIE, REFRESH_COOKIE };
