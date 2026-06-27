import * as React from 'react';
import { cn } from '../internal/cn';

type Gap = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;
type Align = 'start' | 'center' | 'end' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

const gapMap: Record<Gap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
  12: 'gap-12',
  16: 'gap-16',
  24: 'gap-24',
};

const alignMap: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyMap: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  as?: 'div' | 'section' | 'ul' | 'ol' | 'nav';
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = 4, align = 'stretch', justify = 'start', as: Tag = 'div', className, ...rest },
  ref,
) {
  const Component = Tag as 'div';
  return (
    <Component
      ref={ref}
      className={cn('flex flex-col', gapMap[gap], alignMap[align], justifyMap[justify], className)}
      {...rest}
    />
  );
});
