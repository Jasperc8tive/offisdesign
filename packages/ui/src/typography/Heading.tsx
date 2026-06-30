import * as React from 'react';
import { cn } from '../internal/cn';

type Level = 1 | 2 | 3 | 4;

const sizeMap: Record<Level, string> = {
  // Mobile: h2-scale (42px) — avoids overflow on narrow screens.
  // Desktop (md: 900px+): full h1 (60px).
  // Previously: 'text-h1 md:text-h1 sm:text-display-sm' which caused the
  // heading to SHRINK from 60px → 42px at the sm (600px) breakpoint.
  1: 'text-h2 md:text-h1',
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
