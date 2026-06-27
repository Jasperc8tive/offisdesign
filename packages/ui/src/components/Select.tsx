import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../internal/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'bg-background font-body text-body text-secondary h-10 w-full appearance-none rounded-sm border pl-3 pr-9',
          'duration-base focus:shadow-focus transition-colors focus:outline-none',
          invalid
            ? 'border-primary focus:border-primary'
            : 'border-border-strong focus:border-accent',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        width={16}
        height={16}
        aria-hidden
        className="text-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
      />
    </div>
  );
});
