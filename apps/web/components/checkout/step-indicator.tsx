'use client';

import { Check } from 'lucide-react';
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
    <ol aria-label="Checkout progress" className="flex items-start">
      {STEPS.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={s.id} className="relative flex flex-1 flex-col items-center gap-2">
            {/* Connector to the next step, behind the markers. */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2',
                  isDone ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'font-body relative z-10 flex h-8 w-8 items-center justify-center rounded-full border font-semibold',
                isActive && 'border-primary bg-primary text-on-dark',
                isDone && 'border-primary bg-primary text-on-dark',
                !isActive && !isDone && 'border-border-strong bg-background text-muted',
              )}
            >
              {isDone ? <Check width={16} height={16} aria-hidden /> : i + 1}
            </span>
            <Text
              size="sm"
              tone={isActive ? 'primary' : isDone ? 'default' : 'muted'}
              className={cn('text-center', isActive && 'font-semibold')}
            >
              {s.label}
            </Text>
          </li>
        );
      })}
    </ol>
  );
}
