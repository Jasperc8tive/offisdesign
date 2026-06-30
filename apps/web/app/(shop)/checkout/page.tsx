'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Alert, Cluster, FormField, Heading, Input, Stack, Text } from '@offisdesign/ui';
import { AddressForm, type AddressValue } from '../../../components/checkout/address-form';
import { OrderSummary } from '../../../components/checkout/order-summary';
import { PaymentStep } from '../../../components/checkout/payment-step';
import { ReviewStep } from '../../../components/checkout/review-step';
import { ShippingMethodStep } from '../../../components/checkout/shipping-method-step';
import { StepIndicator } from '../../../components/checkout/step-indicator';
import {
  useCreatePaymentIntent,
  usePlaceOrder,
  useReviewCheckout,
  useSetShippingAddress,
  useSetShippingMethod,
  useShippingRates,
  useStartCheckout,
} from '../../../lib/hooks/checkout';
import { useAnalytics, useAuth, useCart } from '../../../lib/providers';
import { ApiError } from '../../../lib/api/errors';
import { checkoutService } from '../../../lib/api/services/checkout';
import type { ShippingRate } from '../../../lib/api/schemas';

type Step = 'address' | 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const auth = useAuth();
  const { cart, itemCount, isLoading } = useCart();
  const { track } = useAnalytics();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('address');
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState<AddressValue | null>(null);
  const [billingAddress, setBillingAddress] = useState<AddressValue | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string | null;
    providerRef: string;
    provider: string;
  } | null>(null);
  const [quote, setQuote] = useState<{
    shippingAmount: number;
    taxAmount: number;
    totalAmount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useStartCheckout();
  const setAddress = useSetShippingAddress(sessionId ?? '');
  const setMethod = useSetShippingMethod(sessionId ?? '');
  const reviewCheckout = useReviewCheckout(sessionId ?? '');
  const createIntent = useCreatePaymentIntent(sessionId ?? '');
  const placeOrder = usePlaceOrder(sessionId ?? '');
  const rates = useShippingRates(sessionId ?? undefined);

  useEffect(() => {
    if (auth.user?.email) setEmail((prev) => prev || auth.user!.email);
  }, [auth.user]);

  useEffect(() => {
    if (!isLoading && itemCount === 0) router.replace('/cart');
  }, [isLoading, itemCount, router]);

  useEffect(() => {
    track('checkout_step_viewed', { step });
  }, [step, track]);

  async function handleAddressSubmit(value: AddressValue) {
    setError(null);
    try {
      let id = sessionId;
      if (!id) {
        const session = await startCheckout.mutateAsync(
          email || auth.user?.email || `${crypto.randomUUID()}@guest.offis`,
        );
        id = session.id;
        setSessionId(id);
      }
      await checkoutService.setShippingAddress(id, value as unknown as Record<string, unknown>);
      const billing = sameAsShipping ? value : (billingAddress ?? value);
      await checkoutService.setBillingAddress(id, billing as unknown as Record<string, unknown>);
      setShippingAddress(value);
      setBillingAddress(billing);
      setStep('shipping');
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  async function handleShippingContinue(rate: ShippingRate) {
    setError(null);
    if (!sessionId) return;
    try {
      await setMethod.mutateAsync({
        carrier: rate.carrier,
        service: rate.service,
        amount: rate.amount,
        currency: rate.currency,
      });
      const review = await reviewCheckout.mutateAsync();
      setQuote({
        shippingAmount: review.session.shippingAmount,
        taxAmount: review.session.taxAmount,
        totalAmount: review.session.totalAmount,
      });
      const intent = await createIntent.mutateAsync();
      setPaymentIntent({
        clientSecret: intent.clientSecret ?? null,
        providerRef: intent.providerRef,
        provider: intent.provider,
      });
      setSelectedRate(rate);
      setStep('payment');
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  function handlePaymentConfirmed(providerRef: string) {
    setPaymentIntent((prev) => (prev ? { ...prev, providerRef } : prev));
    setStep('review');
  }

  async function handlePlaceOrder() {
    setError(null);
    if (!sessionId || !paymentIntent) return;
    try {
      const order = await placeOrder.mutateAsync({
        idempotencyKey: `co-${sessionId}-${paymentIntent.providerRef}`,
        paymentIntentRef: paymentIntent.providerRef,
      });
      track('purchase', {
        orderId: order.id,
        value: order.totalAmount / 100,
        currency: order.currency,
      });
      router.push(`/checkout/${order.id}/confirmation`);
    } catch (err) {
      setError(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  if (isLoading || !cart) return <Text tone="muted">Loading checkout…</Text>;

  return (
    <Stack gap={6}>
      <Heading level={1}>Checkout</Heading>
      <StepIndicator current={step as 'address' | 'shipping' | 'payment' | 'review'} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Checkout">
          <Stack gap={6}>
            {error && <Alert variant="error">{error}</Alert>}
            {step === 'address' && (
              <Stack gap={6}>
                {!auth.isAuthenticated && (
                  <Stack gap={3}>
                    <Heading level={3}>Contact</Heading>
                    <FormField
                      label="Email"
                      htmlFor="checkout-email"
                      required
                      helperText="For your order confirmation and delivery updates."
                    >
                      <Input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </FormField>
                  </Stack>
                )}
                <AddressForm
                  {...(shippingAddress ? { initial: shippingAddress } : {})}
                  submitting={startCheckout.isPending || setAddress.isPending}
                  onSubmit={handleAddressSubmit}
                  sameAsShippingValue={sameAsShipping}
                  onSameAsShippingChange={setSameAsShipping}
                />
              </Stack>
            )}
            {step === 'shipping' && (
              <ShippingMethodStep
                rates={rates.data}
                isLoading={rates.isLoading}
                isError={rates.isError}
                {...(selectedRate?.id ? { initialRateId: selectedRate.id } : {})}
                submitting={
                  setMethod.isPending || reviewCheckout.isPending || createIntent.isPending
                }
                onContinue={handleShippingContinue}
              />
            )}
            {step === 'payment' && paymentIntent && (
              <PaymentStep
                clientSecret={paymentIntent.clientSecret}
                provider={paymentIntent.provider}
                providerRef={paymentIntent.providerRef}
                returnUrl={`${window.location.origin}/checkout/${sessionId}/confirmation`}
                onConfirmed={handlePaymentConfirmed}
              />
            )}
            {step === 'review' && shippingAddress && billingAddress && selectedRate && (
              <ReviewStep
                email={email}
                shippingAddress={shippingAddress}
                billingAddress={billingAddress}
                shippingRate={selectedRate}
                onEdit={(s) => setStep(s)}
                onPlaceOrder={handlePlaceOrder}
                submitting={placeOrder.isPending}
                error={error}
              />
            )}
          </Stack>
        </section>
        <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            cart={cart}
            {...(quote
              ? {
                  shippingAmount: quote.shippingAmount,
                  taxAmount: quote.taxAmount,
                  total: quote.totalAmount,
                }
              : {})}
          />
          <Cluster gap={2} align="center" justify="center" className="mt-4">
            <Lock width={14} height={14} aria-hidden className="text-primary" />
            <Text size="sm" tone="muted">
              Encrypted &amp; secure checkout
            </Text>
          </Cluster>
        </aside>
      </div>
    </Stack>
  );
}
