import * as React from 'react';
import { cn } from '../internal/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max = 100, label, className, ...rest },
  ref,
) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn('bg-primary-subtle h-1.5 w-full overflow-hidden rounded-full', className)}
      {...rest}
    >
      <div
        className="bg-primary duration-base ease-standard h-full transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
