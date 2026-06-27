import * as React from 'react';
import { cn } from '../internal/cn';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, id, ...rest },
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
          type="radio"
          className="border-border-strong bg-background checked:border-primary focus-visible:shadow-focus peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full border transition-colors focus-visible:outline-none disabled:cursor-not-allowed"
          {...rest}
        />
        <span className="bg-primary pointer-events-none h-2.5 w-2.5 rounded-full opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  );
});
