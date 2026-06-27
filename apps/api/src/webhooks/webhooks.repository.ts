import { Injectable } from '@nestjs/common';
import { WebhookDeliveryStatus, type Prisma } from '@offisdesign/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string) {
    return this.prisma.webhook.findUnique({ where: { id } });
  }

  create(data: Prisma.WebhookCreateInput) {
    return this.prisma.webhook.create({ data });
  }

  update(id: string, data: Prisma.WebhookUpdateInput) {
    return this.prisma.webhook.update({ where: { id }, data });
  }

  rotateSecret(id: string, secret: string) {
    return this.prisma.webhook.update({ where: { id }, data: { secret } });
  }

  remove(id: string) {
    return this.prisma.webhook.delete({ where: { id } });
  }

  // Deliveries
  createDelivery(input: { id: string; webhookId: string; eventId: string }) {
    return this.prisma.webhookDelivery.create({
      data: {
        id: input.id,
        webhookId: input.webhookId,
        eventId: input.eventId,
      },
    });
  }

  findPending(limit = 100) {
    return this.prisma.webhookDelivery.findMany({
      where: {
        status: WebhookDeliveryStatus.PENDING,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  findFailed(limit = 100) {
    return this.prisma.webhookDelivery.findMany({
      where: { status: WebhookDeliveryStatus.FAILED },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  updateDelivery(id: string, data: Prisma.WebhookDeliveryUpdateInput) {
    return this.prisma.webhookDelivery.update({ where: { id }, data });
  }

  listDeliveriesForWebhook(webhookId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findEventById(id: string) {
    return this.prisma.domainEvent.findUnique({ where: { id } });
  }

  /** Subscribers to a given event type. */
  findSubscribers(eventType: string) {
    return this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: eventType },
      },
    });
  }
}
