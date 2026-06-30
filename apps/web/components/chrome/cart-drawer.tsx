'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import {
  AspectRatio,
  Button,
  Cluster,
  Divider,
  EmptyState,
  PriceTag,
  Quantity,
  Skeleton,
  Stack,
  Text,
} from '@offisdesign/ui';
import { Drawer } from './drawer';
import { Media } from '../media/media';
import { useVariantIndex } from '../../lib/hooks';
import { useCart, toast } from '../../lib/providers';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, isLoading, itemCount, updateItem, removeItem } = useCart();
  const { index, isLoading: indexLoading } = useVariantIndex({ enabled: open && itemCount > 0 });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      label="Cart"
      title={`Your bag${itemCount > 0 ? ` (${itemCount})` : ''}`}
    >
      {isLoading || !cart ? (
        <div className="p-6">
          <Text tone="muted">Loading cart…</Text>
        </div>
      ) : itemCount === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Your bag is empty"
            description="Add office furniture to start building your workspace."
            action={
              <Link href="/search" onClick={onClose}>
                <Button>Browse office furniture</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <Stack gap={3} className="p-4">
          {cart.cart.items.map((line) => {
            const ref = index.get(line.variantId);
            const href = ref ? `/products/${ref.slug}` : undefined;
            return (
              <Cluster key={line.id} gap={3} align="start" wrap={false}>
                <div className="w-20 shrink-0">
                  {href ? (
                    <Link
                      href={href}
                      onClick={onClose}
                      className="focus-visible:ring-primary block rounded-sm focus-visible:outline-none focus-visible:ring-2"
                    >
                      <AspectRatio ratio={1} className="bg-primary-subtle rounded-sm">
                        <Media mediaId={ref?.mediaId} alt={ref?.name ?? ''} sizes="80px" />
                      </AspectRatio>
                    </Link>
                  ) : (
                    <AspectRatio ratio={1} className="bg-primary-subtle rounded-sm" />
                  )}
                </div>
                <Stack gap={1} className="min-w-0 flex-1">
                  <Cluster justify="between" align="start" wrap={false}>
                    {indexLoading && !ref ? (
                      <Skeleton className="h-4 w-28" />
                    ) : href ? (
                      <Link
                        href={href}
                        onClick={onClose}
                        className="text-secondary hover:text-primary truncate font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
                      >
                        {ref!.name}
                      </Link>
                    ) : (
                      <Text className="text-secondary font-semibold">Item</Text>
                    )}
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={async () => {
                        await removeItem(line.variantId);
                        toast.success('Removed');
                      }}
                      className="text-muted hover:text-primary focus-visible:ring-primary shrink-0 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                    >
                      <Trash2 width={16} height={16} aria-hidden />
                    </button>
                  </Cluster>
                  <Cluster justify="between" align="center">
                    <Quantity
                      value={line.quantity}
                      onChange={(q) => updateItem({ variantId: line.variantId, quantity: q })}
                    />
                    <PriceTag
                      amount={line.unitAmount * line.quantity}
                      currency={line.currency}
                      size="sm"
                    />
                  </Cluster>
                </Stack>
              </Cluster>
            );
          })}
          <Divider />
          <Stack gap={2}>
            <Cluster justify="between">
              <Text tone="muted">Subtotal</Text>
              <PriceTag amount={cart.subtotal} currency={cart.cart.currency} />
            </Cluster>
            {cart.discount > 0 && (
              <Cluster justify="between">
                <Text tone="muted">Discount</Text>
                <Text>
                  − <PriceTag amount={cart.discount} currency={cart.cart.currency} size="sm" />
                </Text>
              </Cluster>
            )}
            <Divider />
            <Cluster justify="between" align="center">
              <Text className="text-secondary font-semibold">Total</Text>
              <PriceTag amount={cart.total} currency={cart.cart.currency} size="lg" />
            </Cluster>
            <Link href="/checkout" onClick={onClose}>
              <Button size="lg" fullWidth>
                Checkout
              </Button>
            </Link>
            <Link href="/cart" onClick={onClose}>
              <Button variant="ghost" fullWidth>
                Open cart page
              </Button>
            </Link>
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}
