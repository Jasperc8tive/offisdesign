import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CustomerApplicationService } from './customer.app';
import {
  addressSchema,
  type AddressInput,
  changePasswordSchema,
  type ChangePasswordInput,
  completePasswordResetSchema,
  type CompletePasswordResetInput,
  registerSchema,
  type RegisterInput,
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
  updateProfileSchema,
  type UpdateProfileInput,
  verifyEmailSchema,
  type VerifyEmailInput,
} from './dto/customer.dto';
import type { Principal } from '../auth/principal';

@ApiTags('customer')
@Controller('v1/customer')
export class CustomerController {
  constructor(private readonly app: CustomerApplicationService) {}

  // ── Public ────────────────────────────────────────────────────────────

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.app.register(body);
  }

  @Post('verify-email')
  @HttpCode(204)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmailInput) {
    await this.app.verifyEmail(body.token);
  }

  @Post('request-password-reset')
  @HttpCode(204)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async requestPasswordReset(
    @Body(new ZodValidationPipe(requestPasswordResetSchema)) body: RequestPasswordResetInput,
  ) {
    await this.app.requestPasswordReset(body.email);
  }

  @Post('complete-password-reset')
  @HttpCode(204)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async completePasswordReset(
    @Body(new ZodValidationPipe(completePasswordResetSchema)) body: CompletePasswordResetInput,
  ) {
    await this.app.completePasswordReset(body);
  }

  // ── Authenticated ─────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentPrincipal() p: Principal) {
    return this.app.getProfile(p.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentPrincipal() p: Principal,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.app.updateProfile(p.id, body);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async changePassword(
    @CurrentPrincipal() p: Principal,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
  ) {
    await this.app.changePassword(p.id, body);
  }

  @Post('me/deactivate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deactivate(@CurrentPrincipal() p: Principal) {
    await this.app.deactivate(p.id);
  }

  // Addresses
  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  listAddresses(@CurrentPrincipal() p: Principal) {
    return this.app.listAddresses(p.id);
  }

  @Post('me/addresses')
  @UseGuards(JwtAuthGuard)
  addAddress(
    @CurrentPrincipal() p: Principal,
    @Body(new ZodValidationPipe(addressSchema)) body: AddressInput,
  ) {
    return this.app.addAddress(p.id, body);
  }

  @Patch('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  updateAddress(
    @CurrentPrincipal() p: Principal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addressSchema.partial())) body: Partial<AddressInput>,
  ) {
    return this.app.updateAddress(p.id, id, body);
  }

  @Delete('me/addresses/:id')
  @UseGuards(JwtAuthGuard)
  deleteAddress(@CurrentPrincipal() p: Principal, @Param('id') id: string) {
    return this.app.deleteAddress(p.id, id);
  }

  // Sessions
  @Get('me/sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(@CurrentPrincipal() p: Principal) {
    return this.app.listSessions(p.id);
  }

  @Delete('me/sessions/:id')
  @UseGuards(JwtAuthGuard)
  revokeSession(@CurrentPrincipal() p: Principal, @Param('id') id: string) {
    return this.app.revokeSession(p.id, id);
  }
}
