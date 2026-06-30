import * as React from 'react';
import { cn } from '../internal/cn';

export interface PriceTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Minor units (e.g. kobo). Single source of truth — locked at Stage 3. */
  amount: number;
  currency?: string;
  /** Optional original price (also in minor units) to render as strikethrough. */
  originalAmount?: number | undefined;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'text-body-sm',
  md: 'text-body',
  lg: 'text-h4',
} as const;

function format(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export const PriceTag = React.forwardRef<HTMLSpanElement, PriceTagProps>(function PriceTag(
  { amount, currency = 'NGN', originalAmount, locale = 'en-NG', size = 'md', className, ...rest },
  ref,
) {
  const isOnSale = originalAmount !== undefined && originalAmount > amount;
  return (
    <span
      ref={ref}
      className={cn('font-body inline-flex items-baseline gap-2', sizeMap[size], className)}
      {...rest}
    >
      <span className={cn('font-semibold', isOnSale ? 'text-primary' : 'text-secondary')}>
        {format(amount, currency, locale)}
      </span>
      {isOnSale && (
        <span className="text-body-sm text-muted line-through" aria-label="Original price">
          {format(originalAmount, currency, locale)}
        </span>
      )}
    </span>
  );
});
