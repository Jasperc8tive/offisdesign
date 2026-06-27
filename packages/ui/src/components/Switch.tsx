import * as React from 'react';
import { cn } from '../internal/cn';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, label, id, disabled, className },
  ref,
) {
  const internalId = React.useId();
  const switchId = id ?? internalId;
  return (
    <label
      htmlFor={switchId}
      className={cn(
        'font-body text-body text-secondary inline-flex cursor-pointer items-center gap-3',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'duration-base focus-visible:shadow-focus relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none',
          checked ? 'bg-primary' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'bg-background duration-base inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
      {label}
    </label>
  );
});
