import * as React from 'react';
import { cn } from '../internal/cn';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  /** Hide from a11y tree when purely decorative. */
  decorative?: boolean;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', decorative = true, className, ...rest },
  ref,
) {
  const role = decorative ? 'presentation' : 'separator';
  return (
    <div
      ref={ref}
      role={role}
      // aria-orientation is only valid on role="separator"; it is not an
      // allowed attribute on role="presentation" (decorative dividers).
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
      {...rest}
    />
  );
});
