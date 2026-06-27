import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationStatus, type NotificationChannel, type Prisma } from '@offisdesign/database';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import { NotificationsRepository } from './notifications.repository';
import { EMAIL_ADAPTER, type EmailAdapter, type EmailMessage } from './notifications.interface';
import { renderTemplate } from './template';

export const templateInputSchema = z.object({
  key: z.string().min(1).max(120),
  channel: z.enum(['EMAIL', 'SMS', 'PUSH']),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
});
export type TemplateInput = z.infer<typeof templateInputSchema>;

export const enqueueSchema = z.object({
  templateKey: z.string().min(1),
  recipient: z.string().min(1).max(320),
  payload: z.record(z.unknown()).default({}),
});
export type EnqueueInput = z.infer<typeof enqueueSchema>;

@Injectable()
export class NotificationsAppService {
  constructor(
    private readonly repo: NotificationsRepository,
    @Inject(EMAIL_ADAPTER) private readonly emailAdapter: EmailAdapter,
  ) {}

  listTemplates() {
    return this.repo.listTemplates();
  }

  async createTemplate(input: TemplateInput) {
    if (await this.repo.templateKeyExists(input.key)) {
      throw new ConflictException({ code: 'TEMPLATE_KEY_TAKEN' });
    }
    return this.repo.createTemplate({
      id: uuidv7(),
      key: input.key,
      channel: input.channel,
      ...(input.subject ? { subject: input.subject } : {}),
      body: input.body,
      ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
      isActive: input.isActive,
    });
  }

  async updateTemplate(id: string, input: Partial<TemplateInput>) {
    return this.repo.updateTemplate(id, {
      ...(input.subject !== undefined ? { subject: input.subject ?? null } : {}),
      ...(input.body ? { body: input.body } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  deleteTemplate(id: string) {
    return this.repo.deleteTemplate(id);
  }

  async enqueue(input: EnqueueInput) {
    const template = await this.repo.findTemplate(input.templateKey);
    if (!template || !template.isActive) {
      throw new BadRequestException({
        code: 'TEMPLATE_NOT_FOUND',
        message: `Template "${input.templateKey}" is not active.`,
      });
    }
    return this.repo.createDelivery({
      id: uuidv7(),
      templateKey: template.key,
      channel: template.channel,
      recipient: input.recipient,
      payload: input.payload as Prisma.InputJsonValue,
      status: NotificationStatus.PENDING,
    });
  }

  listDeliveries(filter: {
    status?: NotificationStatus | undefined;
    templateKey?: string | undefined;
    page: number;
    pageSize: number;
  }) {
    return this.repo.listDeliveries(filter);
  }

  /** Worker entry — process pending deliveries through their channel adapter. */
  async processPending() {
    const pending = await this.repo.findPending();
    let sent = 0;
    let failed = 0;
    for (const delivery of pending) {
      const template = await this.repo.findTemplate(delivery.templateKey);
      if (!template) {
        await this.repo.updateDeliveryStatus(delivery.id, NotificationStatus.FAILED, {
          error: 'template_missing',
        });
        failed++;
        continue;
      }
      try {
        const vars = delivery.payload as Record<string, unknown>;
        if (template.channel === ('EMAIL' as NotificationChannel)) {
          const message: EmailMessage = {
            to: delivery.recipient,
            subject: renderTemplate(template.subject ?? '', vars),
            text: renderTemplate(template.body, vars),
          };
          const result = await this.emailAdapter.send(message);
          await this.repo.updateDeliveryStatus(delivery.id, NotificationStatus.SENT, {
            providerId: result.id,
          });
          sent++;
        } else {
          // SMS / PUSH adapters not yet wired — mark FAILED with reason so it
          // surfaces in delivery-log views.
          await this.repo.updateDeliveryStatus(delivery.id, NotificationStatus.FAILED, {
            error: 'channel_not_available',
          });
          failed++;
        }
      } catch (err) {
        await this.repo.updateDeliveryStatus(delivery.id, NotificationStatus.FAILED, {
          error: (err as Error).message,
        });
        failed++;
      }
    }
    return { sent, failed, considered: pending.length };
  }

  async retry(id: string) {
    const delivery = await this.repo.findDelivery(id);
    if (!delivery) throw new NotFoundException();
    if (delivery.status === NotificationStatus.SENT) return delivery;
    return this.repo.updateDeliveryStatus(id, NotificationStatus.PENDING);
  }
}
