import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CmsStatus } from '@offisdesign/database';
import type { Queue } from 'bullmq';
import { QueueService } from '../queue/queue.service';
import { EventBus } from '../events/event-bus.service';
import { SEARCH_SERVICE, type SearchService } from '../search/search.interface';
import { CacheService } from '../redis/cache.service';
import { InventoryDomainService } from '../inventory/inventory.domain';
import { CheckoutApplicationService } from '../checkout/checkout.app';
import { PrismaService } from '../prisma/prisma.service';
import {
  EMAIL_ADAPTER,
  type EmailAdapter,
  type EmailMessage,
} from '../notifications/notifications.interface';
import { WebhooksAppService } from '../webhooks/webhooks.app';
import { NotificationsAppService } from '../notifications/notifications.app';
import { MediaApplicationService } from '../media/media.app';
import { PageRepository } from '../cms/page.repository';
import { BlogRepository } from '../cms/blog.repository';

export const SEARCH_INDEX_QUEUE = 'search-index';
export const CACHE_INVALIDATE_QUEUE = 'cache-invalidate';
export const IMAGE_PROCESSING_QUEUE = 'image-processing';
export const RESERVATION_CLEANUP_QUEUE = 'reservation-cleanup';
export const EMAIL_QUEUE = 'email-send';
export const CHECKOUT_CLEANUP_QUEUE = 'checkout-cleanup';
export const ABANDONED_CART_QUEUE = 'abandoned-cart-scan';
export const PAYMENT_RECONCILE_QUEUE = 'payment-reconcile';
export const SCHEDULED_PUBLISH_QUEUE = 'scheduled-publish';
export const WEBHOOK_DISPATCH_QUEUE = 'webhook-dispatch';
export const NOTIFICATION_DELIVERY_QUEUE = 'notification-delivery';
export const MEDIA_CLEANUP_QUEUE = 'media-cleanup';

interface SearchIndexJob {
  kind: 'product' | 'page' | 'post' | 'media';
  id: string;
  op: 'index' | 'unindex';
}

interface CacheInvalidateJob {
  keys: string[];
}

type EmailJob = EmailMessage;

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private searchQueue!: Queue<SearchIndexJob>;
  private cacheQueue!: Queue<CacheInvalidateJob>;
  private reservationCleanupQueue!: Queue<{ tick: number }>;
  private checkoutCleanupQueue!: Queue<{ tick: number }>;
  private abandonedCartQueue!: Queue<{ tick: number }>;
  private paymentReconcileQueue!: Queue<{ tick: number }>;
  private scheduledPublishQueue!: Queue<{ tick: number }>;
  private webhookDispatchQueue!: Queue<{ tick: number }>;
  private notificationDeliveryQueue!: Queue<{ tick: number }>;
  private mediaCleanupQueue!: Queue<{ tick: number }>;

  constructor(
    private readonly queues: QueueService,
    private readonly events: EventBus,
    private readonly cache: CacheService,
    private readonly inventory: InventoryDomainService,
    private readonly checkout: CheckoutApplicationService,
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksAppService,
    private readonly notifications: NotificationsAppService,
    private readonly media: MediaApplicationService,
    private readonly pages: PageRepository,
    private readonly blog: BlogRepository,
    @Inject(SEARCH_SERVICE) private readonly search: SearchService,
    @Inject(EMAIL_ADAPTER) private readonly email: EmailAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    // Register queues
    this.searchQueue = this.queues.registerQueue(SEARCH_INDEX_QUEUE) as Queue<SearchIndexJob>;
    this.cacheQueue = this.queues.registerQueue(
      CACHE_INVALIDATE_QUEUE,
    ) as Queue<CacheInvalidateJob>;
    this.queues.registerQueue(IMAGE_PROCESSING_QUEUE);
    this.queues.registerQueue(EMAIL_QUEUE);
    this.reservationCleanupQueue = this.queues.registerQueue(RESERVATION_CLEANUP_QUEUE) as Queue<{
      tick: number;
    }>;
    this.checkoutCleanupQueue = this.queues.registerQueue(CHECKOUT_CLEANUP_QUEUE) as Queue<{
      tick: number;
    }>;
    this.abandonedCartQueue = this.queues.registerQueue(ABANDONED_CART_QUEUE) as Queue<{
      tick: number;
    }>;
    this.paymentReconcileQueue = this.queues.registerQueue(PAYMENT_RECONCILE_QUEUE) as Queue<{
      tick: number;
    }>;
    this.scheduledPublishQueue = this.queues.registerQueue(SCHEDULED_PUBLISH_QUEUE) as Queue<{
      tick: number;
    }>;
    this.webhookDispatchQueue = this.queues.registerQueue(WEBHOOK_DISPATCH_QUEUE) as Queue<{
      tick: number;
    }>;
    this.notificationDeliveryQueue = this.queues.registerQueue(
      NOTIFICATION_DELIVERY_QUEUE,
    ) as Queue<{ tick: number }>;
    this.mediaCleanupQueue = this.queues.registerQueue(MEDIA_CLEANUP_QUEUE) as Queue<{
      tick: number;
    }>;

    // Workers
    this.queues.registerWorker<SearchIndexJob, void>(SEARCH_INDEX_QUEUE, async (job) => {
      // Only product is wired to the SearchService for now; page/post/media
      // are placeholders for a future Meili/Typesense adapter.
      if (job.data.kind === 'product') {
        if (job.data.op === 'index') await this.search.index(job.data.id);
        else await this.search.unindex(job.data.id);
      }
    });

    this.queues.registerWorker<CacheInvalidateJob, void>(CACHE_INVALIDATE_QUEUE, async (job) => {
      for (const key of job.data.keys) await this.cache.del(key);
    });

    this.queues.registerWorker(IMAGE_PROCESSING_QUEUE, async (job) => {
      // Foundation only — feature stage wires Sharp / IPX / external service.
      const data = job.data as { mediaId?: string };
      if (data.mediaId) {
        this.logger.debug(`image-processing for media ${data.mediaId} (no-op placeholder)`);
      }
    });

    this.queues.registerWorker<EmailJob, void>(EMAIL_QUEUE, async (job) => {
      await this.email.send(job.data);
    });

    this.queues.registerWorker<{ tick: number }, number>(RESERVATION_CLEANUP_QUEUE, async () => {
      const expired = await this.inventory.expireStale();
      if (expired > 0) this.logger.log(`Expired ${expired} stale reservations`);
      return expired;
    });

    this.queues.registerWorker<{ tick: number }, number>(CHECKOUT_CLEANUP_QUEUE, async () => {
      const cancelled = await this.checkout.expireStale();
      if (cancelled > 0) this.logger.log(`Cancelled ${cancelled} stale checkout sessions`);
      return cancelled;
    });

    this.queues.registerWorker<{ tick: number }, number>(ABANDONED_CART_QUEUE, async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await this.prisma.cart.count({
        where: { status: 'ACTIVE', updatedAt: { lt: since }, items: { some: {} } },
      });
      if (count > 0) this.logger.debug(`abandoned-cart-scan: ${count} candidates`);
      return count;
    });

    this.queues.registerWorker<{ tick: number }, number>(PAYMENT_RECONCILE_QUEUE, async () => {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000);
      const stuck = await this.prisma.payment.count({
        where: { status: 'PENDING', createdAt: { lt: cutoff } },
      });
      if (stuck > 0) this.logger.warn(`payment-reconcile: ${stuck} stuck payments`);
      return stuck;
    });

    // CMS scheduled publish/unpublish — both pages and posts.
    this.queues.registerWorker<
      { tick: number },
      { pagesPub: number; postsPub: number; pagesUnp: number; postsUnp: number }
    >(SCHEDULED_PUBLISH_QUEUE, async () => {
      const now = new Date();
      const pagesPub = await this.pages.findScheduledForPublish(now);
      for (const p of pagesPub) {
        await this.pages.update(p.id, p.version, {
          status: CmsStatus.PUBLISHED,
          publishedAt: now,
          scheduledAt: null,
        });
      }
      const postsPub = await this.blog.findScheduledForPublish(now);
      for (const p of postsPub) {
        await this.blog.updatePost(p.id, p.version, {
          status: CmsStatus.PUBLISHED,
          publishedAt: now,
          scheduledAt: null,
        });
      }
      const pagesUnp = await this.pages.findScheduledForUnpublish(now);
      for (const p of pagesUnp) {
        await this.pages.update(p.id, p.version, {
          status: CmsStatus.DRAFT,
          unscheduledAt: null,
        });
      }
      const postsUnp = await this.blog.findScheduledForUnpublish(now);
      for (const p of postsUnp) {
        await this.blog.updatePost(p.id, p.version, {
          status: CmsStatus.DRAFT,
          unscheduledAt: null,
        });
      }
      const summary = {
        pagesPub: pagesPub.length,
        postsPub: postsPub.length,
        pagesUnp: pagesUnp.length,
        postsUnp: postsUnp.length,
      };
      const totals = Object.values(summary).reduce((a, b) => a + b, 0);
      if (totals > 0) this.logger.log(`scheduled-publish processed ${JSON.stringify(summary)}`);
      return summary;
    });

    // Webhook outbound dispatch.
    this.queues.registerWorker<
      { tick: number },
      { considered: number; success: number; failed: number }
    >(WEBHOOK_DISPATCH_QUEUE, async () => this.webhooks.dispatchPending());

    // Notification delivery.
    this.queues.registerWorker<
      { tick: number },
      { sent: number; failed: number; considered: number }
    >(NOTIFICATION_DELIVERY_QUEUE, async () => this.notifications.processPending());

    // Media cleanup — purge soft-deleted media older than 7d.
    this.queues.registerWorker<{ tick: number }, number>(MEDIA_CLEANUP_QUEUE, async () => {
      const purged = await this.media.runCleanup();
      if (purged > 0) this.logger.log(`media-cleanup: purged ${purged} items`);
      return purged;
    });

    // Event listeners → enqueue side-effects
    this.events.on('product.created', async (e) => {
      await this.searchQueue.add('index', {
        kind: 'product',
        id: e.payload.productId,
        op: 'index',
      });
    });
    this.events.on('product.updated', async (e) => {
      await this.searchQueue.add('index', {
        kind: 'product',
        id: e.payload.productId,
        op: 'index',
      });
      await this.cacheQueue.add('invalidate', { keys: [`cat:product:slug:${e.payload.slug}`] });
    });
    this.events.on('product.published', async (e) => {
      await this.searchQueue.add('index', {
        kind: 'product',
        id: e.payload.productId,
        op: 'index',
      });
    });
    this.events.on('product.archived', async (e) => {
      await this.searchQueue.add('unindex', {
        kind: 'product',
        id: e.payload.productId,
        op: 'unindex',
      });
    });
    this.events.on('product.deleted', async (e) => {
      await this.searchQueue.add('unindex', {
        kind: 'product',
        id: e.payload.productId,
        op: 'unindex',
      });
    });
    this.events.on('collection.updated', async (e) => {
      await this.cacheQueue.add('invalidate', { keys: [`cat:collection:slug:${e.payload.slug}`] });
    });
    this.events.on('category.updated', async () => {
      await this.cacheQueue.add('invalidate', { keys: ['cat:category:tree'] });
    });

    // Webhook fan-out — every persisted event creates one delivery row per
    // subscribing webhook. The PENDING rows are picked up by the dispatch
    // worker tick.
    this.events.on('order.placed', async (e) => {
      // We don't have direct access to the domain_event row id here; fan-out
      // is keyed on event type, so we look up the latest matching row.
      await this.fanOutLatest('order.placed', 'order', e.aggregateId);
    });
    this.events.on('payment.succeeded', async (e) => {
      await this.fanOutLatest('payment.succeeded', 'order', e.aggregateId);
    });
    this.events.on('payment.failed', async (e) => {
      await this.fanOutLatest('payment.failed', 'order', e.aggregateId);
    });

    // Schedules
    await this.reservationCleanupQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 60_000 }, jobId: 'reservation-cleanup-cron' },
    );
    await this.checkoutCleanupQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 5 * 60_000 }, jobId: 'checkout-cleanup-cron' },
    );
    await this.abandonedCartQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 60 * 60_000 }, jobId: 'abandoned-cart-cron' },
    );
    await this.paymentReconcileQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 10 * 60_000 }, jobId: 'payment-reconcile-cron' },
    );
    await this.scheduledPublishQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 60_000 }, jobId: 'scheduled-publish-cron' },
    );
    await this.webhookDispatchQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 30_000 }, jobId: 'webhook-dispatch-cron' },
    );
    await this.notificationDeliveryQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 30_000 }, jobId: 'notification-delivery-cron' },
    );
    await this.mediaCleanupQueue.add(
      'tick',
      { tick: 0 },
      { repeat: { every: 24 * 60 * 60_000 }, jobId: 'media-cleanup-cron' },
    );
  }

  /** Fan out the most recent persisted domain_event row matching type+aggregate. */
  private async fanOutLatest(type: string, aggregateType: string, aggregateId: string) {
    const event = await this.prisma.domainEvent.findFirst({
      where: { type, aggregateType, aggregateId },
      orderBy: { occurredAt: 'desc' },
    });
    if (event) await this.webhooks.fanOut(event.id, event.type);
  }
}
