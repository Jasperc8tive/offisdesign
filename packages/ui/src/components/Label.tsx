import * as React from 'react';
import { cn } from '../internal/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, className, children, ...rest },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('font-body text-body-sm text-secondary inline-block font-semibold', className)}
      {...rest}
    >
      {children}
      {required && (
        <span className="text-primary ml-1" aria-hidden>
          *
        </span>
      )}
    </label>
  );
});
