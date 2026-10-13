import { Inject, Injectable } from '@nestjs/common';
import { CustomerDomainService } from './customer.domain';
import { SessionService } from '../auth/session.service';
import { toPublicCustomer, toPublicSession } from './customer.view';
import { CustomerRepository } from './customer.repository';
import { EventBus } from '../events/event-bus.service';
import { EMAIL_ADAPTER, type EmailAdapter } from '../notifications/notifications.interface';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';
import type {
  AddressInput,
  ChangePasswordInput,
  CompletePasswordResetInput,
  RegisterInput,
  UpdateProfileInput,
} from './dto/customer.dto';

@Injectable()
export class CustomerApplicationService {
  constructor(
    private readonly domain: CustomerDomainService,
    private readonly repo: CustomerRepository,
    private readonly sessions: SessionService,
    private readonly events: EventBus,
    @Inject(EMAIL_ADAPTER) private readonly email: EmailAdapter,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async register(input: RegisterInput) {
    const { customer, verificationToken } = await this.domain.register(input);
    await this.events.publish('customer.registered', 'customer', customer.id, {
      customerId: customer.id,
      email: customer.email,
    });
    await this.sendVerificationEmail(customer.email, verificationToken.raw);
    return toPublicCustomer(customer);
  }

  async verifyEmail(token: string) {
    const customer = await this.domain.verifyEmail(token);
    await this.events.publish('customer.email-verified', 'customer', customer.id, {
      customerId: customer.id,
      email: customer.email,
    });
    return toPublicCustomer(customer);
  }

  async requestPasswordReset(email: string) {
    const result = await this.domain.requestPasswordReset(email);
    // Always succeed without revealing whether the email exists (no enumeration).
    if (result) {
      await this.sendPasswordResetEmail(email, result.raw);
    }
  }

  async completePasswordReset(input: CompletePasswordResetInput) {
    return toPublicCustomer(await this.domain.completePasswordReset(input));
  }

  async changePassword(customerId: string, input: ChangePasswordInput, currentSessionId?: string) {
    return toPublicCustomer(await this.domain.changePassword(customerId, input, currentSessionId));
  }

  async getProfile(customerId: string) {
    return toPublicCustomer(await this.repo.findById(customerId));
  }

  async updateProfile(customerId: string, input: UpdateProfileInput) {
    return toPublicCustomer(await this.domain.updateProfile(customerId, input));
  }

  listAddresses(customerId: string) {
    return this.repo.listAddresses(customerId);
  }

  addAddress(customerId: string, input: AddressInput) {
    return this.domain.addAddress(customerId, input);
  }

  updateAddress(customerId: string, addressId: string, input: Partial<AddressInput>) {
    return this.domain.updateAddress(customerId, addressId, input);
  }

  deleteAddress(customerId: string, addressId: string) {
    return this.domain.deleteAddress(customerId, addressId);
  }

  async listSessions(customerId: string, currentSessionId?: string) {
    const sessions = await this.repo.listSessions(customerId);
    return sessions.map((s) => toPublicSession(s, currentSessionId));
  }

  /** Revokes one of the customer's own sessions (and its refresh token). */
  async revokeSession(customerId: string, sessionId: string) {
    return { revoked: await this.sessions.revokeCustomerSession(customerId, sessionId) };
  }

  async deactivate(customerId: string) {
    return toPublicCustomer(await this.domain.deactivate(customerId));
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async sendVerificationEmail(to: string, token: string) {
    const link = `${this.env.WEB_PUBLIC_URL}/account/verify?token=${encodeURIComponent(token)}`;
    await this.email.send({
      to,
      subject: 'Verify your email',
      text: `Welcome to Offisdesign. Verify your email: ${link}`,
    });
  }

  private async sendPasswordResetEmail(to: string, token: string) {
    const link = `${this.env.WEB_PUBLIC_URL}/account/reset?token=${encodeURIComponent(token)}`;
    await this.email.send({
      to,
      subject: 'Reset your password',
      text: `Reset your password: ${link}`,
    });
  }
}
