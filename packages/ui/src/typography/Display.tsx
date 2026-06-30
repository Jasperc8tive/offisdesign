import * as React from 'react';
import { cn } from '../internal/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';

// Responsive by design — large display type would overflow narrow screens at a
// single fixed size, so each step scales up across breakpoints. Mobile starts
// one or two steps down and reaches the nominal size on wider viewports.
const sizeMap: Record<Size, string> = {
  sm: 'text-display-sm',
  md: 'text-display-sm sm:text-display-md',
  lg: 'text-display-md sm:text-display-lg',
  xl: 'text-display-md sm:text-display-lg lg:text-display-xl',
};

export interface DisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: Size;
  as?: 'div' | 'span' | 'h1' | 'h2';
}

export const Display = React.forwardRef<HTMLDivElement, DisplayProps>(function Display(
  { size = 'md', as: Tag = 'div', className, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as never}
      className={cn(
        'font-display text-secondary uppercase tracking-wide',
        sizeMap[size],
        className,
      )}
      {...rest}
    />
  );
});
