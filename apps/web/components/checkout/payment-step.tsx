'use client';

import dynamic from 'next/dynamic';
import { Alert, Button, Stack, Text } from '@offisdesign/ui';
import { apiConfig } from '../../lib/api/config';

interface Props {
  clientSecret: string | null;
  provider: string;
  providerRef: string;
  /** Where Stripe redirects after off-session flows (3DS, wallets). */
  returnUrl: string;
  onConfirmed: (providerRef: string) => void;
}

// The Stripe SDK (~heavy) is only needed once the customer reaches the payment
// step, so it's split into its own chunk and loaded on demand.
const StripePaymentStep = dynamic(() => import('./payment-step-stripe'), {
  ssr: false,
  loading: () => <Text tone="muted">Loading secure payment…</Text>,
});

/**
 * Hides provider-specific surface area behind a single `<PaymentStep>` API.
 * A Stripe intent with a `clientSecret` lazy-loads the Stripe Elements island.
 * The mock provider gets a direct confirm CTA, outside production builds only.
 * Anything else fails closed: no way to proceed without a real payment.
 */
export function PaymentStep(props: Props) {
  if (props.provider === 'mock' && process.env.NODE_ENV !== 'production') {
    return (
      <Stack gap={3}>
        <Alert variant="info" title="Mock payment">
          Development payment provider. Order will be placed without a real charge.
        </Alert>
        <Button onClick={() => props.onConfirmed(props.providerRef)}>Confirm payment</Button>
      </Stack>
    );
  }
  if (props.provider !== 'stripe' || !props.clientSecret || !apiConfig.stripePublishableKey) {
    return (
      <Alert variant="error" title="Payment unavailable">
        Payment is unavailable right now. Please try again shortly or contact us to complete your
        order.
      </Alert>
    );
  }
  return (
    <StripePaymentStep
      clientSecret={props.clientSecret}
      providerRef={props.providerRef}
      returnUrl={props.returnUrl}
      onConfirmed={props.onConfirmed}
    />
  );
}
