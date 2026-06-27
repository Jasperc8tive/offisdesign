import * as React from 'react';
import { cn } from '../internal/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'muted';

const variantMap: Record<Variant, string> = {
  primary: 'bg-primary text-on-dark',
  secondary: 'bg-secondary text-on-dark',
  outline: 'bg-transparent text-secondary border border-border-strong',
  muted: 'bg-primary-subtle text-primary',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'primary', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'font-body text-caption inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide',
        variantMap[variant],
        className,
      )}
      {...rest}
    />
  );
});
