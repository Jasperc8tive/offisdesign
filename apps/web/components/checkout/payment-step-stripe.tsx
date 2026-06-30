'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Alert, Button, Stack, Text } from '@offisdesign/ui';
import { apiConfig } from '../../lib/api/config';

interface Props {
  clientSecret: string;
  providerRef: string;
  /** Where Stripe redirects after off-session flows (3DS, wallets). */
  returnUrl: string;
  onConfirmed: (providerRef: string) => void;
}

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(apiConfig.stripePublishableKey);
  return stripePromise;
}

/**
 * Stripe Elements island. Loaded only via `next/dynamic` from `PaymentStep`
 * (ssr: false), so the Stripe SDK is fetched the moment the customer reaches the
 * payment step rather than being bundled into the initial checkout JS.
 */
export default function StripePaymentStep({
  clientSecret,
  providerRef,
  returnUrl,
  onConfirmed,
}: Props) {
  const options = useMemo(
    () => ({ clientSecret, appearance: { theme: 'stripe' as const } }),
    [clientSecret],
  );
  return (
    <Elements stripe={getStripe()} options={options}>
      <StripePaymentInner
        providerRef={providerRef}
        returnUrl={returnUrl}
        onConfirmed={onConfirmed}
      />
    </Elements>
  );
}

function StripePaymentInner({
  providerRef,
  returnUrl,
  onConfirmed,
}: {
  providerRef: string;
  returnUrl: string;
  onConfirmed: (providerRef: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [providerRef]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message ?? 'Payment could not be confirmed.');
      setSubmitting(false);
      return;
    }
    const intent = result.paymentIntent;
    if (intent && (intent.status === 'succeeded' || intent.status === 'requires_capture')) {
      onConfirmed(intent.id);
      return;
    }
    setError('Payment is still processing. Please try again in a moment.');
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        {!ready && <Text tone="muted">Loading payment form…</Text>}
        <PaymentElement onReady={() => setReady(true)} />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" loading={submitting} disabled={!stripe || !ready}>
          Pay and review order
        </Button>
      </Stack>
    </form>
  );
}
