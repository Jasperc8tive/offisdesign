import { Global, Module, type Provider } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { MockPaymentService } from './mock-payment.service';
import { PaymentRepository } from './payment.repository';
import { PAYMENT_SERVICE } from './payment.interface';
import { PaymentWebhookController } from './webhook.controller';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';

/**
 * The active provider is chosen at boot from `PAYMENT_PROVIDER`. Mock is the
 * default — Stripe is opted into explicitly so a misconfigured environment
 * never reaches the real Stripe API by accident.
 */
const paymentServiceProvider: Provider = {
  provide: PAYMENT_SERVICE,
  inject: [API_ENV],
  useFactory: (env: ApiEnv) => {
    if (env.PAYMENT_PROVIDER === 'stripe') return new StripePaymentService(env);
    return new MockPaymentService();
  },
};

@Global()
@Module({
  controllers: [PaymentWebhookController],
  providers: [PaymentRepository, paymentServiceProvider],
  exports: [PAYMENT_SERVICE, PaymentRepository],
})
export class PaymentsModule {}
