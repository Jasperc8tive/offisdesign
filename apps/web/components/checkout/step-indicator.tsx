'use client';

import { Text } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';

const STEPS = [
  { id: 'address', label: 'Address' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
] as const;

export type CheckoutStepId = (typeof STEPS)[number]['id'];

interface Props {
  current: CheckoutStepId;
}

export function StepIndicator({ current }: Props) {
  const activeIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <ol aria-label="Checkout progress" className="font-body text-body-sm flex items-start gap-2">
      {STEPS.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <li key={s.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border font-semibold',
                isActive && 'border-primary bg-primary text-on-dark',
                isDone && 'border-primary bg-primary-subtle text-primary',
                !isActive && !isDone && 'border-border-strong text-muted',
              )}
              aria-current={isActive ? 'step' : undefined}
            >
              {i + 1}
            </div>
            <Text
              size="sm"
              tone={isActive ? 'primary' : 'muted'}
              className={isActive ? 'font-semibold' : ''}
            >
              {s.label}
            </Text>
          </li>
        );
      })}
    </ol>
  );
}
