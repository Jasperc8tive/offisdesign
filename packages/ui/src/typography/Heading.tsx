import * as React from 'react';
import { cn } from '../internal/cn';

type Level = 1 | 2 | 3 | 4;

const sizeMap: Record<Level, string> = {
  1: 'text-h1 md:text-h1 sm:text-display-sm',
  2: 'text-h2',
  3: 'text-h3',
  4: 'text-h4',
};

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: Level;
  /** Render as a different tag while keeping visual level (e.g. semantic h2 styled as h1). */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, as, className, children, ...rest },
  ref,
) {
  const Tag = (as ?? `h${level}`) as 'h1';
  return (
    <Tag
      ref={ref}
      className={cn('font-heading text-secondary', sizeMap[level], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
});
