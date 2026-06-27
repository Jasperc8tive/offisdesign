import * as React from 'react';
import { cn } from '../internal/cn';

type Gap = 0 | 1 | 2 | 3 | 4 | 6 | 8;
type Align = 'start' | 'center' | 'end' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between';

const gapMap: Record<Gap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
};

const alignMap: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
};

const justifyMap: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

export const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(function Cluster(
  { gap = 3, align = 'center', justify = 'start', wrap = true, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-row',
        wrap && 'flex-wrap',
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        className,
      )}
      {...rest}
    />
  );
});
