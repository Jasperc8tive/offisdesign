'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkoutService } from '../api/services/checkout';

export const checkoutKeys = {
  rates: (sessionId: string) => ['checkout', 'rates', sessionId] as const,
  orders: (params: { page?: number; pageSize?: number }) => ['orders', params] as const,
  order: (id: string) => ['order', id] as const,
};

export function useStartCheckout() {
  return useMutation({ mutationFn: (email: string) => checkoutService.start(email) });
}

export function useShippingRates(sessionId: string | undefined) {
  return useQuery({
    queryKey: checkoutKeys.rates(sessionId ?? ''),
    queryFn: () => checkoutService.shippingRates(sessionId!),
    enabled: !!sessionId,
  });
}

export function useSetShippingAddress(sessionId: string) {
  return useMutation({
    mutationFn: (address: Record<string, unknown>) =>
      checkoutService.setShippingAddress(sessionId, address),
  });
}

export function useSetShippingMethod(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (method: Record<string, unknown>) =>
      checkoutService.setShippingMethod(sessionId, method),
    onSuccess: () => qc.invalidateQueries({ queryKey: checkoutKeys.rates(sessionId) }),
  });
}

export function useReviewCheckout(sessionId: string) {
  return useMutation({ mutationFn: () => checkoutService.review(sessionId) });
}

export function useCreatePaymentIntent(sessionId: string) {
  return useMutation({ mutationFn: () => checkoutService.paymentIntent(sessionId) });
}

export function usePlaceOrder(sessionId: string) {
  return useMutation({
    mutationFn: ({
      idempotencyKey,
      paymentIntentRef,
    }: {
      idempotencyKey: string;
      paymentIntentRef?: string;
    }) =>
      checkoutService.place(
        sessionId,
        idempotencyKey,
        paymentIntentRef ? { paymentIntentRef } : {},
      ),
  });
}

export function useOrders(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: checkoutKeys.orders(params),
    queryFn: () => checkoutService.orders(params),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: checkoutKeys.order(id ?? ''),
    queryFn: () => checkoutService.order(id!),
    enabled: !!id,
  });
}
