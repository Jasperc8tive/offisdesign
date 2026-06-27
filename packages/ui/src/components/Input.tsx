import * as React from 'react';
import { cn } from '../internal/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leadingIcon, trailingIcon, className, type = 'text', ...rest },
  ref,
) {
  const inputEl = (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'bg-background font-body text-body text-secondary placeholder:text-muted h-10 w-full rounded-sm border px-3',
        'duration-base focus:shadow-focus transition-colors focus:outline-none',
        invalid
          ? 'border-primary focus:border-primary'
          : 'border-border-strong focus:border-accent',
        !!leadingIcon && 'pl-10',
        !!trailingIcon && 'pr-10',
        className,
      )}
      {...rest}
    />
  );
  if (!leadingIcon && !trailingIcon) return inputEl;
  return (
    <div className="relative">
      {leadingIcon && (
        <span className="text-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {leadingIcon}
        </span>
      )}
      {inputEl}
      {trailingIcon && (
        <span className="text-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {trailingIcon}
        </span>
      )}
    </div>
  );
});
