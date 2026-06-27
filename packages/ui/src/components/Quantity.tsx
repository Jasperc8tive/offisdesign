import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../internal/cn';

export interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const Quantity = React.forwardRef<HTMLDivElement, QuantityProps>(function Quantity(
  { value, onChange, min = 1, max = 99, step = 1, label = 'Quantity', className, disabled },
  ref,
) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn(
        'border-border-strong bg-background inline-flex items-center rounded-sm border',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={dec}
        className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary inline-flex h-10 w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus width={16} height={16} aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        aria-label={label}
        className="border-border-strong font-body text-body text-secondary h-10 w-12 border-x bg-transparent text-center font-semibold focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={inc}
        className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary inline-flex h-10 w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus width={16} height={16} aria-hidden />
      </button>
    </div>
  );
});
