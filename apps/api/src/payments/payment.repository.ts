import { Injectable } from '@nestjs/common';
import { type Prisma, PaymentStatus } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    id: string;
    orderId: string;
    provider: string;
    providerRef: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    providerData: Prisma.InputJsonValue;
  }) {
    return this.prisma.payment.create({ data: input });
  }

  findByProviderRef(provider: string, providerRef: string) {
    return this.prisma.payment.findUnique({
      where: { provider_providerRef: { provider, providerRef } },
    });
  }

  updateStatus(id: string, status: PaymentStatus, providerData?: Prisma.InputJsonValue) {
    return this.prisma.payment.update({
      where: { id },
      data: { status, ...(providerData !== undefined ? { providerData } : {}) },
    });
  }
}
