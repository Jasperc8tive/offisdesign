import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import type { ApiEnv } from '@offisdesign/config';
import { API_ENV } from '../config/config.module';
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
 * Stripe adapter. The Stripe SDK is the only Stripe-aware code in the
 * codebase — order/checkout layers see only the PaymentService interface.
 */
@Injectable()
export class StripePaymentService implements PaymentService {
  readonly provider = 'stripe';
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe payment provider requires STRIPE_SECRET_KEY');
    }
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe payment provider requires STRIPE_WEBHOOK_SECRET');
    }
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY);
    this.webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  }

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: input.amount,
        currency: input.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          reference: input.reference,
          ...(input.customerId ? { customerId: input.customerId } : {}),
          ...(input.metadata ?? {}),
        },
      },
      { idempotencyKey: `intent:${input.reference}` },
    );
    return {
      providerRef: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency.toUpperCase(),
      status: mapStatus(intent.status),
      raw: redactedRaw(intent),
    };
  }

  async confirm(providerRef: string): Promise<ConfirmedPayment> {
    const intent = await this.stripe.paymentIntents.retrieve(providerRef);
    return {
      providerRef: intent.id,
      amount: intent.amount,
      currency: intent.currency.toUpperCase(),
      status: mapConfirmedStatus(intent.status),
      ...(intent.last_payment_error?.message
        ? { failureReason: intent.last_payment_error.message }
        : {}),
      raw: redactedRaw(intent),
    };
  }

  async refund(input: RefundInput): Promise<Refund> {
    const refund = await this.stripe.refunds.create(
      {
        payment_intent: input.providerRef,
        amount: input.amount,
        ...(input.reason
          ? { reason: 'requested_by_customer', metadata: { reason: input.reason } }
          : {}),
      },
      { idempotencyKey: `refund:${input.providerRef}:${input.amount}` },
    );
    return {
      providerRef: refund.id,
      amount: refund.amount ?? input.amount,
      currency: (refund.currency ?? '').toUpperCase(),
      status:
        refund.status === 'succeeded'
          ? 'succeeded'
          : refund.status === 'failed'
            ? 'failed'
            : 'pending',
      raw: redactedRaw(refund),
    };
  }

  parseWebhook(rawBody: Buffer, signatureHeader: string | undefined): WebhookEvent {
    if (!signatureHeader) throw new Error('Missing Stripe signature header');
    const event = this.stripe.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);
    return { id: event.id, type: event.type, data: event.data };
  }
}

function mapStatus(s: Stripe.PaymentIntent.Status): PaymentIntent['status'] {
  switch (s) {
    case 'succeeded':
      return 'succeeded';
    case 'canceled':
      return 'canceled';
    case 'requires_action':
    case 'requires_confirmation':
      return 'requires_action';
    case 'requires_payment_method':
      return 'requires_payment_method';
    default:
      return 'requires_action';
  }
}

function mapConfirmedStatus(s: Stripe.PaymentIntent.Status): ConfirmedPayment['status'] {
  switch (s) {
    case 'succeeded':
      return 'succeeded';
    case 'canceled':
      return 'canceled';
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method':
      return 'requires_action';
    default:
      return 'failed';
  }
}

/** Strip irrelevant noise from the raw object before we persist it. */
function redactedRaw(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const r = obj as Record<string, unknown>;
  // Stripe responses are JSON-serialisable; we just drop the lastResponse helper.
  if ('lastResponse' in r) {
    const { lastResponse: _drop, ...rest } = r;
    return rest;
  }
  return r;
}
