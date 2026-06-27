import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PAYMENT_SERVICE, type PaymentService } from './payment.interface';
import { PaymentRepository } from './payment.repository';
import { EventBus } from '../events/event-bus.service';
import { PaymentStatus } from '@offisdesign/database';

@ApiTags('payments')
@Controller('v1/payments')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    @Inject(PAYMENT_SERVICE) private readonly payments: PaymentService,
    private readonly repo: PaymentRepository,
    private readonly events: EventBus,
  ) {}

  /**
   * Provider webhook. Signature is verified inside the PaymentService — no
   * provider SDK leaks out of the payments module.
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: Request, @Headers('stripe-signature') signature?: string) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) throw new BadRequestException('Missing raw body');
    let event;
    try {
      event = this.payments.parseWebhook(raw, signature);
    } catch (err) {
      this.logger.warn(`Webhook signature failure: ${(err as Error).message}`);
      throw new BadRequestException('Invalid signature');
    }
    this.logger.log(`Webhook ${event.type} ${event.id}`);

    // The provider's reference id is on the data object — extract generically.
    const data = event.data as {
      object?: { id?: string; status?: string; metadata?: Record<string, string> };
    };
    const providerRef = data.object?.id;
    if (!providerRef) return { ok: true };

    const payment = await this.repo.findByProviderRef(this.payments.provider, providerRef);
    if (!payment) {
      // Likely an event for an intent we haven't persisted yet (e.g. test data).
      return { ok: true };
    }

    if (event.type.endsWith('.succeeded')) {
      await this.repo.updateStatus(payment.id, PaymentStatus.CAPTURED, data.object as object);
      await this.events.publish('payment.succeeded', 'payment', payment.id, {
        orderId: payment.orderId,
        provider: this.payments.provider,
        providerRef,
        amount: payment.amount,
        currency: payment.currency,
      });
    } else if (event.type.endsWith('.failed') || event.type.endsWith('.payment_failed')) {
      await this.repo.updateStatus(payment.id, PaymentStatus.FAILED, data.object as object);
      await this.events.publish('payment.failed', 'payment', payment.id, {
        orderId: payment.orderId,
        provider: this.payments.provider,
        providerRef,
        reason: data.object?.status ?? 'unknown',
      });
    }
    return { ok: true };
  }
}
