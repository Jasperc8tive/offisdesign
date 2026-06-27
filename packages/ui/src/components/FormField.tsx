import * as React from 'react';
import { cn } from '../internal/cn';
import { Label } from './Label';

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Composition wrapper: label + control + helper/error text with consistent
 * aria-describedby wiring. Pass the control via `children` and supply matching
 * `htmlFor`/`id`.
 */
export function FormField({
  label,
  htmlFor,
  required,
  helperText,
  errorText,
  className,
  children,
}: FormFieldProps) {
  const helperId = React.useId();
  const errorId = React.useId();
  const describedBy = [errorText && errorId, helperText && helperId].filter(Boolean).join(' ');

  const enhancedChildren =
    React.isValidElement(children) && describedBy
      ? React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': describedBy,
        })
      : children;

  const labelProps: { htmlFor?: string; required?: boolean } = {};
  if (htmlFor !== undefined) labelProps.htmlFor = htmlFor;
  if (required !== undefined) labelProps.required = required;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label {...labelProps}>{label}</Label>}
      {enhancedChildren}
      {errorText && (
        <p id={errorId} className="font-body text-body-sm text-primary">
          {errorText}
        </p>
      )}
      {!errorText && helperText && (
        <p id={helperId} className="font-body text-body-sm text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
