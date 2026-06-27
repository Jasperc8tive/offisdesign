import * as React from 'react';
import { cn } from '../internal/cn';

type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: Size;
  label?: string;
}

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label = 'Loading', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={cn(
        'border-primary inline-block animate-spin rounded-full border-r-transparent',
        sizeMap[size],
        className,
      )}
      {...rest}
    />
  );
});
