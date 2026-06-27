import * as React from 'react';
import { cn } from '../internal/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'main' | 'header' | 'footer' | 'article';
  /** Strip horizontal padding (used when nested). */
  flush?: boolean;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { as: Tag = 'div', flush, className, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as never}
      className={cn('max-w-container mx-auto w-full', !flush && 'px-6 md:px-16', className)}
      {...rest}
    />
  );
});
