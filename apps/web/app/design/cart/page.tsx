'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import {
  AspectRatio,
  Button,
  Cluster,
  Divider,
  EmptyState,
  Heading,
  Icon,
  PriceTag,
  Quantity,
  Stack,
  Text,
} from '@offisdesign/ui';

interface LineItem {
  id: string;
  name: string;
  option: string;
  unitAmount: number;
  qty: number;
}

const initial: LineItem[] = [
  { id: '1', name: 'Branch 3-seater sofa', option: 'Oak / Linen Sand', unitAmount: 129900, qty: 1 },
  { id: '2', name: 'Walnut side chair', option: 'Walnut', unitAmount: 39900, qty: 2 },
];

export default function CartPrototype() {
  const [items, setItems] = useState<LineItem[]>(initial);
  const subtotal = items.reduce((sum, i) => sum + i.unitAmount * i.qty, 0);
  const shipping = subtotal > 50000 ? 0 : 1500;
  const total = subtotal + shipping;

  return (
    <Stack gap={4}>
      <Heading level={2}>Cart drawer</Heading>
      <Text tone="muted">
        Composition validation — in production this is a slide-over drawer; here it's inlined.
      </Text>

      <div className="border-border bg-background mx-auto w-full max-w-md rounded-md border shadow-md">
        <Cluster justify="between" align="center" className="border-border border-b p-4">
          <Heading level={4}>Your bag ({items.length})</Heading>
          <Button variant="ghost" size="sm" aria-label="Close cart">
            <Icon icon={X} decorative />
          </Button>
        </Cluster>
        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Your bag is empty"
              description="Start adding pieces to see them here."
              action={<Button onClick={() => setItems(initial)}>Reset demo</Button>}
            />
          </div>
        ) : (
          <Stack gap={3} className="max-h-[60vh] overflow-y-auto p-4">
            {items.map((it) => (
              <div key={it.id} className="flex gap-3">
                <div className="w-20 shrink-0">
                  <AspectRatio ratio={1} className="bg-primary-subtle rounded-sm" />
                </div>
                <Stack gap={1} className="flex-1">
                  <Cluster justify="between" align="start">
                    <Text className="text-secondary font-semibold">{it.name}</Text>
                    <button
                      type="button"
                      aria-label={`Remove ${it.name}`}
                      onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                      className="text-muted hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-2"
                    >
                      <Trash2 width={16} height={16} aria-hidden />
                    </button>
                  </Cluster>
                  <Text size="sm" tone="muted">
                    {it.option}
                  </Text>
                  <Cluster justify="between" align="center">
                    <Quantity
                      value={it.qty}
                      onChange={(n) =>
                        setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, qty: n } : x)))
                      }
                    />
                    <PriceTag amount={it.unitAmount * it.qty} size="sm" />
                  </Cluster>
                </Stack>
              </div>
            ))}
          </Stack>
        )}
        {items.length > 0 && (
          <Stack gap={2} className="border-border border-t p-4">
            <Cluster justify="between">
              <Text size="sm" tone="muted">
                Subtotal
              </Text>
              <PriceTag amount={subtotal} size="sm" />
            </Cluster>
            <Cluster justify="between">
              <Text size="sm" tone="muted">
                Shipping
              </Text>
              <Text size="sm">{shipping === 0 ? 'Free' : '£15'}</Text>
            </Cluster>
            <Divider />
            <Cluster justify="between" align="center">
              <Text className="text-secondary font-semibold">Total</Text>
              <PriceTag amount={total} />
            </Cluster>
            <Button size="lg" fullWidth>
              Checkout
            </Button>
            <Button variant="ghost" fullWidth>
              Continue shopping
            </Button>
          </Stack>
        )}
      </div>
    </Stack>
  );
}
