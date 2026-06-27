import { Injectable } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';
import type {
  ConfirmedPayment,
  CreateIntentInput,
  PaymentIntent,
  PaymentService,
  Refund,
  RefundInput,
  WebhookEvent,
} from './payment.interface';

/**
 * Mock payment provider for development + tests. Always succeeds. Webhook
 * verification is a no-op.
 */
@Injectable()
export class MockPaymentService implements PaymentService {
  readonly provider = 'mock';
  private readonly intents = new Map<string, PaymentIntent>();

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const ref = `mock_pi_${uuidv7()}`;
    const intent: PaymentIntent = {
      providerRef: ref,
      clientSecret: `${ref}_secret`,
      amount: input.amount,
      currency: input.currency,
      status: 'requires_payment_method',
      raw: { id: ref, mock: true, reference: input.reference },
    };
    this.intents.set(ref, intent);
    return intent;
  }

  async confirm(providerRef: string): Promise<ConfirmedPayment> {
    const intent = this.intents.get(providerRef);
    if (!intent) {
      return {
        providerRef,
        amount: 0,
        currency: 'GBP',
        status: 'failed',
        failureReason: 'unknown_intent',
        raw: { id: providerRef, mock: true },
      };
    }
    return {
      providerRef,
      amount: intent.amount,
      currency: intent.currency,
      status: 'succeeded',
      raw: { id: providerRef, mock: true, status: 'succeeded' },
    };
  }

  async refund(input: RefundInput): Promise<Refund> {
    return {
      providerRef: `mock_re_${uuidv7()}`,
      amount: input.amount,
      currency: 'GBP',
      status: 'succeeded',
      raw: { id: input.providerRef, mock: true, refunded: input.amount },
    };
  }

  parseWebhook(_rawBody: Buffer, _signatureHeader: string | undefined): WebhookEvent {
    return { id: uuidv7(), type: 'mock.event', data: {} };
  }
}
