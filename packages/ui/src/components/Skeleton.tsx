import * as React from 'react';
import { cn } from '../internal/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  full: 'rounded-full',
} as const;

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { rounded = 'sm', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="status"
      aria-busy
      aria-live="polite"
      className={cn('bg-primary-subtle animate-pulse', roundedMap[rounded], className)}
      {...rest}
    />
  );
});
