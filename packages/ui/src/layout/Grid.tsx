import * as React from 'react';
import { cn } from '../internal/cn';

type Cols = 1 | 2 | 3 | 4 | 6 | 12;
type Gap = 0 | 2 | 3 | 4 | 6 | 8 | 12;

const colsMap: Record<Cols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12',
};

const gapMap: Record<Gap, string> = {
  0: 'gap-0',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
  12: 'gap-12',
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: Cols;
  gap?: Gap;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  { cols = 3, gap = 6, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cn('grid', colsMap[cols], gapMap[gap], className)} {...rest} />;
});
