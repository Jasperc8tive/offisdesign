'use client';

import * as React from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutateAsyncFunction,
} from '@tanstack/react-query';
import { cartService } from '../api/services/cart';
import type { CartView } from '../api/schemas';

interface CartContextValue {
  cart: CartView | undefined;
  isLoading: boolean;
  itemCount: number;
  addItem: UseMutateAsyncFunction<CartView, Error, { variantId: string; quantity?: number }>;
  updateItem: UseMutateAsyncFunction<CartView, Error, { variantId: string; quantity: number }>;
  removeItem: UseMutateAsyncFunction<CartView, Error, string>;
  clear: UseMutateAsyncFunction<CartView, Error, void>;
  applyCoupon: UseMutateAsyncFunction<CartView, Error, string | null>;
}

const CartContext = React.createContext<CartContextValue | null>(null);
const cartKey = ['cart', 'current'] as const;

/**
 * Cart provider. All mutations apply optimistic updates against the
 * `['cart','current']` query so badges update before the server confirms.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const cartQuery = useQuery({
    queryKey: cartKey,
    queryFn: () => cartService.get(),
    staleTime: 30_000,
  });

  function setCart(next: CartView) {
    queryClient.setQueryData<CartView>(cartKey, next);
  }

  const addItem = useMutation({
    mutationFn: ({ variantId, quantity = 1 }: { variantId: string; quantity?: number }) =>
      cartService.addItem(variantId, quantity),
    onMutate: async ({ variantId, quantity = 1 }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<CartView>(cartKey);
      if (previous) {
        const existing = previous.cart.items.find((i) => i.variantId === variantId);
        const optimistic: CartView = {
          ...previous,
          cart: {
            ...previous.cart,
            items: existing
              ? previous.cart.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i,
                )
              : [
                  ...previous.cart.items,
                  {
                    id: `optimistic-${variantId}`,
                    cartId: previous.cart.id,
                    variantId,
                    quantity,
                    unitAmount: 0,
                    currency: previous.cart.currency,
                  },
                ],
          },
        };
        setCart(optimistic);
      }
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) setCart(ctx.previous);
    },
    onSuccess: setCart,
  });

  const updateItem = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      cartService.updateItem(variantId, quantity),
    onMutate: async ({ variantId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<CartView>(cartKey);
      if (previous) {
        const optimistic: CartView = {
          ...previous,
          cart: {
            ...previous.cart,
            items:
              quantity === 0
                ? previous.cart.items.filter((i) => i.variantId !== variantId)
                : previous.cart.items.map((i) =>
                    i.variantId === variantId ? { ...i, quantity } : i,
                  ),
          },
        };
        setCart(optimistic);
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) setCart(ctx.previous);
    },
    onSuccess: setCart,
  });

  const removeItem = useMutation({
    mutationFn: (variantId: string) => cartService.removeItem(variantId),
    onMutate: async (variantId) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<CartView>(cartKey);
      if (previous) {
        setCart({
          ...previous,
          cart: {
            ...previous.cart,
            items: previous.cart.items.filter((i) => i.variantId !== variantId),
          },
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) setCart(ctx.previous);
    },
    onSuccess: setCart,
  });

  const clear = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: setCart,
  });

  const applyCoupon = useMutation({
    mutationFn: (code: string | null) => cartService.applyCoupon(code),
    onSuccess: setCart,
  });

  const itemCount = cartQuery.data?.cart.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  const value: CartContextValue = {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    itemCount,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    removeItem: removeItem.mutateAsync,
    clear: clear.mutateAsync,
    applyCoupon: applyCoupon.mutateAsync,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
