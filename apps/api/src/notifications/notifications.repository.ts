import { Injectable } from '@nestjs/common';
import { NotificationStatus, type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Templates
  listTemplates() {
    return this.prisma.notificationTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  findTemplate(key: string) {
    return this.prisma.notificationTemplate.findUnique({ where: { key } });
  }

  templateKeyExists(key: string) {
    return this.prisma.notificationTemplate
      .findUnique({ where: { key }, select: { id: true } })
      .then((r) => r != null);
  }

  createTemplate(data: Prisma.NotificationTemplateCreateInput) {
    return this.prisma.notificationTemplate.create({ data });
  }

  updateTemplate(id: string, data: Prisma.NotificationTemplateUpdateInput) {
    return this.prisma.notificationTemplate.update({ where: { id }, data });
  }

  deleteTemplate(id: string) {
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }

  // Deliveries
  createDelivery(data: Prisma.NotificationDeliveryCreateInput) {
    return this.prisma.notificationDelivery.create({ data });
  }

  findDelivery(id: string) {
    return this.prisma.notificationDelivery.findUnique({ where: { id } });
  }

  updateDeliveryStatus(
    id: string,
    status: NotificationStatus,
    extra: { providerId?: string; error?: string } = {},
  ) {
    return this.prisma.notificationDelivery.update({
      where: { id },
      data: {
        status,
        ...(status === NotificationStatus.SENT ? { sentAt: new Date() } : {}),
        ...(extra.providerId ? { providerId: extra.providerId } : {}),
        ...(extra.error ? { error: extra.error } : {}),
        attempts: { increment: 1 },
      },
    });
  }

  listDeliveries(filter: {
    status?: NotificationStatus | undefined;
    templateKey?: string | undefined;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.NotificationDeliveryWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.templateKey ? { templateKey: filter.templateKey } : {}),
    };
    return Promise.all([
      this.prisma.notificationDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.notificationDelivery.count({ where }),
    ]);
  }

  findPending(limit = 100) {
    return this.prisma.notificationDelivery.findMany({
      where: { status: NotificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
