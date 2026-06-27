import * as React from 'react';
import { cn } from '../internal/cn';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Polymorphic, style-free container. Use when no other primitive fits — kept
 * intentionally minimal so it stays a primitive, not a kitchen sink.
 */
export const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(
  { as: Tag = 'div', className, ...rest },
  ref,
) {
  const Component = Tag as 'div';
  return <Component ref={ref} className={cn(className)} {...rest} />;
});
