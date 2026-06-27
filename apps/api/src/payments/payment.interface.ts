export interface CreateIntentInput {
  amount: number;
  currency: string;
  /** Order id or checkout session id — caller chooses idempotency context. */
  reference: string;
  /** Optional customer id for provider-side bookkeeping. */
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntent {
  /** Provider primary key. */
  providerRef: string;
  /** Client-facing secret/token (Stripe `client_secret`); never logged. */
  clientSecret: string | null;
  amount: number;
  currency: string;
  status: 'requires_action' | 'requires_payment_method' | 'succeeded' | 'canceled' | 'failed';
  /** Raw provider object for persistence in `Payment.providerData`. */
  raw: unknown;
}

export interface ConfirmedPayment {
  providerRef: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'canceled' | 'requires_action';
  failureReason?: string;
  raw: unknown;
}

export interface RefundInput {
  providerRef: string;
  amount: number;
  reason?: string;
}

export interface Refund {
  providerRef: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  raw: unknown;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: unknown;
}

export interface PaymentService {
  readonly provider: string;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  confirm(providerRef: string): Promise<ConfirmedPayment>;
  refund(input: RefundInput): Promise<Refund>;
  /**
   * Verify & parse a signed webhook. Throws on signature failure. The provider
   * boundary lives here — controllers never touch the raw provider SDK.
   */
  parseWebhook(rawBody: Buffer, signatureHeader: string | undefined): WebhookEvent;
}

export const PAYMENT_SERVICE = Symbol('PAYMENT_SERVICE');
