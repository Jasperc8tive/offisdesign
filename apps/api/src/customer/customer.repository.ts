import { Injectable } from '@nestjs/common';
import { type Prisma, VerificationTokenKind } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  emailExists(email: string): Promise<boolean> {
    return this.prisma.customer
      .findUnique({ where: { email }, select: { id: true } })
      .then((r) => r != null);
  }

  create(data: Prisma.CustomerCreateInput) {
    return this.prisma.customer.create({ data });
  }

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Addresses ─────────────────────────────────────────────────────────

  listAddresses(customerId: string) {
    return this.prisma.customerAddress.findMany({
      where: { customerId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findAddress(id: string) {
    return this.prisma.customerAddress.findUnique({ where: { id } });
  }

  createAddress(data: Prisma.CustomerAddressCreateInput) {
    return this.prisma.customerAddress.create({ data });
  }

  updateAddress(id: string, data: Prisma.CustomerAddressUpdateInput) {
    return this.prisma.customerAddress.update({ where: { id }, data });
  }

  softDeleteAddress(id: string) {
    return this.prisma.customerAddress.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async clearDefaultAddresses(customerId: string, exceptId?: string) {
    await this.prisma.customerAddress.updateMany({
      where: {
        customerId,
        isDefault: true,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  // ── Sessions ──────────────────────────────────────────────────────────

  listSessions(customerId: string) {
    return this.prisma.customerSession.findMany({
      where: { customerId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  revokeSession(id: string) {
    return this.prisma.customerSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllSessions(customerId: string) {
    return this.prisma.customerSession.updateMany({
      where: { customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Verification tokens ───────────────────────────────────────────────

  createToken(input: {
    id: string;
    customerId: string;
    kind: VerificationTokenKind;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.verificationToken.create({ data: input });
  }

  findToken(tokenHash: string) {
    return this.prisma.verificationToken.findUnique({ where: { tokenHash } });
  }

  markTokenUsed(id: string) {
    return this.prisma.verificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /** Invalidate any other unused tokens of the same kind for this customer. */
  invalidateOtherTokens(customerId: string, kind: VerificationTokenKind, exceptId: string) {
    return this.prisma.verificationToken.updateMany({
      where: { customerId, kind, usedAt: null, id: { not: exceptId } },
      data: { usedAt: new Date() },
    });
  }
}
