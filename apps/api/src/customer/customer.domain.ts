import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { VerificationTokenKind } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { CustomerRepository } from './customer.repository';
import { PasswordService } from '../auth/password.service';
import { generateToken, hashToken } from './token.helper';
import type {
  AddressInput,
  ChangePasswordInput,
  CompletePasswordResetInput,
  RegisterInput,
  UpdateProfileInput,
} from './dto/customer.dto';

const VERIFICATION_TTL_HOURS = 24;
const RESET_TTL_HOURS = 1;

/**
 * Customer domain rules. Token issuance returns the RAW token so the caller
 * (application service) can hand it to the notification adapter — only the
 * hash is persisted.
 */
@Injectable()
export class CustomerDomainService {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly passwords: PasswordService,
  ) {}

  async register(input: RegisterInput) {
    if (await this.repo.emailExists(input.email)) {
      throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email already registered.' });
    }
    const passwordHash = await this.passwords.hash(input.password);
    const customer = await this.repo.create({
      id: uuidv7(),
      email: input.email,
      passwordHash,
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      marketingOptIn: input.marketingOptIn,
    });
    const token = await this.issueToken(customer.id, VerificationTokenKind.EMAIL_VERIFICATION);
    return { customer, verificationToken: token };
  }

  async issueToken(customerId: string, kind: VerificationTokenKind, ttlHours?: number) {
    const ttl =
      ttlHours ??
      (kind === VerificationTokenKind.EMAIL_VERIFICATION
        ? VERIFICATION_TTL_HOURS
        : RESET_TTL_HOURS);
    const { raw, hash } = generateToken();
    const id = uuidv7();
    const expiresAt = new Date(Date.now() + ttl * 60 * 60 * 1000);
    await this.repo.createToken({ id, customerId, kind, tokenHash: hash, expiresAt });
    await this.repo.invalidateOtherTokens(customerId, kind, id);
    return { raw, expiresAt };
  }

  async verifyEmail(rawToken: string) {
    const record = await this.consumeToken(rawToken, VerificationTokenKind.EMAIL_VERIFICATION);
    return this.repo.update(record.customerId, { emailVerifiedAt: new Date() });
  }

  async requestPasswordReset(email: string) {
    const customer = await this.repo.findByEmail(email);
    // Intentionally do not throw on unknown email — prevents enumeration.
    if (!customer || customer.deletedAt) return null;
    return this.issueToken(customer.id, VerificationTokenKind.PASSWORD_RESET);
  }

  async completePasswordReset(input: CompletePasswordResetInput) {
    const record = await this.consumeToken(input.token, VerificationTokenKind.PASSWORD_RESET);
    const passwordHash = await this.passwords.hash(input.password);
    await this.repo.update(record.customerId, { passwordHash });
    // Revoke all sessions on password change.
    await this.repo.revokeAllSessions(record.customerId);
    return this.repo.findById(record.customerId);
  }

  async changePassword(customerId: string, input: ChangePasswordInput) {
    const customer = await this.repo.findById(customerId);
    if (!customer || !customer.passwordHash) throw new NotFoundException();
    const ok = await this.passwords.verify(input.currentPassword, customer.passwordHash);
    if (!ok) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.repo.update(customerId, { passwordHash });
    return this.repo.findById(customerId);
  }

  async updateProfile(customerId: string, input: UpdateProfileInput) {
    const customer = await this.repo.findById(customerId);
    if (!customer || customer.deletedAt) throw new NotFoundException();
    return this.repo.update(customerId, {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
      ...(input.marketingOptIn !== undefined ? { marketingOptIn: input.marketingOptIn } : {}),
    });
  }

  async addAddress(customerId: string, input: AddressInput) {
    const customer = await this.repo.findById(customerId);
    if (!customer || customer.deletedAt) throw new NotFoundException();
    const id = uuidv7();
    const created = await this.repo.createAddress({
      id,
      customer: { connect: { id: customerId } },
      ...(input.label ? { label: input.label } : {}),
      firstName: input.firstName,
      lastName: input.lastName,
      line1: input.line1,
      ...(input.line2 ? { line2: input.line2 } : {}),
      city: input.city,
      ...(input.region ? { region: input.region } : {}),
      postcode: input.postcode,
      countryCode: input.countryCode,
      ...(input.phone ? { phone: input.phone } : {}),
      isDefault: input.isDefault,
    });
    if (input.isDefault) await this.repo.clearDefaultAddresses(customerId, id);
    return created;
  }

  async updateAddress(customerId: string, addressId: string, input: Partial<AddressInput>) {
    const existing = await this.repo.findAddress(addressId);
    if (!existing || existing.customerId !== customerId || existing.deletedAt) {
      throw new NotFoundException();
    }
    const updated = await this.repo.updateAddress(addressId, {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.line1 ? { line1: input.line1 } : {}),
      ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
      ...(input.city ? { city: input.city } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.postcode ? { postcode: input.postcode } : {}),
      ...(input.countryCode ? { countryCode: input.countryCode } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    });
    if (input.isDefault) await this.repo.clearDefaultAddresses(customerId, addressId);
    return updated;
  }

  async deleteAddress(customerId: string, addressId: string) {
    const existing = await this.repo.findAddress(addressId);
    if (!existing || existing.customerId !== customerId) throw new NotFoundException();
    if (existing.deletedAt) return existing;
    return this.repo.softDeleteAddress(addressId);
  }

  async deactivate(customerId: string) {
    const customer = await this.repo.findById(customerId);
    if (!customer) throw new NotFoundException();
    if (customer.deletedAt) return customer;
    await this.repo.revokeAllSessions(customerId);
    return this.repo.softDelete(customerId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async consumeToken(rawToken: string, kind: VerificationTokenKind) {
    const record = await this.repo.findToken(hashToken(rawToken));
    if (!record || record.kind !== kind) {
      throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Token is invalid.' });
    }
    if (record.usedAt) {
      throw new BadRequestException({ code: 'TOKEN_USED', message: 'Token already used.' });
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'TOKEN_EXPIRED', message: 'Token has expired.' });
    }
    await this.repo.markTokenUsed(record.id);
    return record;
  }
}
