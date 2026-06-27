import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebhookDeliveryStatus } from '@offisdesign/database';
import { randomBytes } from 'node:crypto';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { WebhooksRepository } from './webhooks.repository';
import { signPayload } from './hmac';

export const webhookInputSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)),
  isActive: z.boolean().default(true),
});
export type WebhookInput = z.infer<typeof webhookInputSchema>;

const MAX_ATTEMPTS = 6;

@Injectable()
export class WebhooksAppService {
  private readonly logger = new Logger(WebhooksAppService.name);

  constructor(private readonly repo: WebhooksRepository) {}

  list() {
    return this.repo.list();
  }

  async create(input: WebhookInput) {
    const secret = generateSecret();
    return this.repo.create({
      id: uuidv7(),
      url: input.url,
      secret,
      events: input.events,
      isActive: input.isActive,
    });
  }

  async update(id: string, input: Partial<WebhookInput>) {
    return this.repo.update(id, {
      ...(input.url ? { url: input.url } : {}),
      ...(input.events ? { events: input.events } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  remove(id: string) {
    return this.repo.remove(id);
  }

  async rotateSecret(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException();
    return this.repo.rotateSecret(id, generateSecret());
  }

  /** Fan-out an event to every subscribing webhook. Creates PENDING deliveries. */
  async fanOut(eventId: string, eventType: string) {
    const subscribers = await this.repo.findSubscribers(eventType);
    for (const sub of subscribers) {
      await this.repo.createDelivery({ id: uuidv7(), webhookId: sub.id, eventId });
    }
    return subscribers.length;
  }

  listDeliveries(webhookId: string) {
    return this.repo.listDeliveriesForWebhook(webhookId);
  }

  /** Manually re-queue a failed (or pending) delivery for the next worker tick. */
  async replay(deliveryId: string) {
    return this.repo.updateDelivery(deliveryId, {
      status: WebhookDeliveryStatus.PENDING,
      nextAttemptAt: null,
    });
  }

  /**
   * Worker entry — process the pending queue. Posts the event payload signed
   * with the webhook's HMAC secret, then marks SUCCESS / FAILED with backoff.
   */
  async dispatchPending() {
    const pending = await this.repo.findPending();
    let success = 0;
    let failed = 0;
    for (const delivery of pending) {
      const webhook = await this.repo.findById(delivery.webhookId);
      const event = await this.repo.findEventById(delivery.eventId);
      if (!webhook || !event) {
        await this.repo.updateDelivery(delivery.id, {
          status: WebhookDeliveryStatus.FAILED,
          lastError: 'webhook_or_event_missing',
        });
        failed++;
        continue;
      }
      const payload = JSON.stringify({
        id: event.id,
        type: event.type,
        occurredAt: event.occurredAt.toISOString(),
        data: event.payload,
      });
      const signature = signPayload(webhook.secret, payload);
      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'offis-signature': signature,
            'offis-event': event.type,
            'offis-delivery': delivery.id,
          },
          body: payload,
        });
        if (res.ok) {
          await this.repo.updateDelivery(delivery.id, {
            status: WebhookDeliveryStatus.SUCCESS,
            attempts: { increment: 1 },
            deliveredAt: new Date(),
          });
          success++;
        } else {
          await this.recordFailure(delivery.id, delivery.attempts + 1, `HTTP ${res.status}`);
          failed++;
        }
      } catch (err) {
        await this.recordFailure(delivery.id, delivery.attempts + 1, (err as Error).message);
        failed++;
      }
    }
    return { considered: pending.length, success, failed };
  }

  /**
   * Backoff schedule for failed deliveries — exponential up to MAX_ATTEMPTS,
   * then permanent failure. Matches typical webhook conventions:
   *   attempts → next delay
   *      1     →  1 min
   *      2     →  5 min
   *      3     → 15 min
   *      4     →  1 hour
   *      5     →  6 hours
   *     ≥6     → FAILED
   */
  private async recordFailure(id: string, attempts: number, error: string) {
    if (attempts >= MAX_ATTEMPTS) {
      await this.repo.updateDelivery(id, {
        status: WebhookDeliveryStatus.FAILED,
        attempts,
        lastError: error,
      });
      return;
    }
    const delays = [60, 300, 900, 3600, 6 * 3600];
    const seconds = delays[Math.min(attempts - 1, delays.length - 1)] ?? 6 * 3600;
    await this.repo.updateDelivery(id, {
      status: WebhookDeliveryStatus.PENDING,
      attempts,
      lastError: error,
      nextAttemptAt: new Date(Date.now() + seconds * 1000),
    });
    this.logger.warn(`Webhook delivery ${id} attempt ${attempts} failed: ${error}`);
  }
}

function generateSecret(): string {
  return `whsec_${randomBytes(24).toString('base64url')}`;
}
