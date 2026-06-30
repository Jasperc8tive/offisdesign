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
 * When the API returns a Stripe `clientSecret` we lazy-load the Stripe Elements
 * island. When the API returns a mock provider (no clientSecret) we render a
 * fallback CTA that places the order directly.
 */
export function PaymentStep(props: Props) {
  if (!props.clientSecret || !apiConfig.stripePublishableKey) {
    return (
      <Stack gap={3}>
        <Alert variant="info" title="Mock payment">
          No Stripe credentials configured. Order will be placed without a real charge.
        </Alert>
        <Button onClick={() => props.onConfirmed(props.providerRef)}>Confirm payment</Button>
      </Stack>
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
