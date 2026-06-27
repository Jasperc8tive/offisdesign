import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../internal/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  invalid?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, invalid, className, id, ...rest },
  ref,
) {
  const internalId = React.useId();
  const inputId = id ?? internalId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'font-body text-body text-secondary inline-flex cursor-pointer items-center gap-2',
        rest.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={invalid || undefined}
          className="border-border-strong bg-background checked:border-primary checked:bg-primary focus-visible:shadow-focus peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-sm border transition-colors focus-visible:outline-none disabled:cursor-not-allowed"
          {...rest}
        />
        <Check
          width={14}
          height={14}
          aria-hidden
          className="text-on-dark pointer-events-none absolute opacity-0 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
});
