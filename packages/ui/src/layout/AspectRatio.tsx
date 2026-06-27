import * as React from 'react';
import { cn } from '../internal/cn';

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** width / height (e.g. 16/9 = 1.7778). Default 4/3. */
  ratio?: number;
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 4 / 3, className, style, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative w-full overflow-hidden', className)}
      style={{ aspectRatio: String(ratio), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
});
