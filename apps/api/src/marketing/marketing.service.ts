import { ConflictException, Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../events/event-bus.service';

export const subscribeSchema = z.object({
  email: z.string().email().max(200),
  source: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

@Injectable()
export class MarketingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBus,
  ) {}

  async subscribe(input: SubscribeInput) {
    const existing = await this.prisma.newsletterSubscription.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      if (existing.unsubscribedAt) {
        // Re-subscribe — clear the unsubscribe timestamp and refresh consent.
        const refreshed = await this.prisma.newsletterSubscription.update({
          where: { id: existing.id },
          data: {
            unsubscribedAt: null,
            consentedAt: new Date(),
            ...(input.source ? { source: input.source } : {}),
            ...(input.referrer ? { referrer: input.referrer } : {}),
          },
        });
        return { subscribed: true, resubscribed: true, id: refreshed.id };
      }
      throw new ConflictException({
        code: 'ALREADY_SUBSCRIBED',
        message: 'Email is already subscribed.',
      });
    }
    const id = uuidv7();
    await this.prisma.newsletterSubscription.create({
      data: {
        id,
        email: input.email,
        ...(input.source ? { source: input.source } : {}),
        ...(input.referrer ? { referrer: input.referrer } : {}),
      },
    });
    await this.events.publish('newsletter.subscribed', 'newsletter_subscription', id, {
      subscriptionId: id,
      email: input.email,
      ...(input.source ? { source: input.source } : {}),
    });
    return { subscribed: true, resubscribed: false, id };
  }

  async unsubscribe(email: string) {
    const existing = await this.prisma.newsletterSubscription.findUnique({
      where: { email },
    });
    if (!existing || existing.unsubscribedAt) return { unsubscribed: true };
    await this.prisma.newsletterSubscription.update({
      where: { id: existing.id },
      data: { unsubscribedAt: new Date() },
    });
    return { unsubscribed: true };
  }
}
