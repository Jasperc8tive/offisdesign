import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../internal/cn';

export interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value out of `max`, e.g. 4.5 of 5. */
  value: number;
  max?: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

const starSize = { sm: 14, md: 18, lg: 22 } as const;

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(function Rating(
  { value, max = 5, reviewCount, size = 'md', className, ...rest },
  ref,
) {
  const filled = Math.max(0, Math.min(max, value));
  const sz = starSize[size];
  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Rated ${value} out of ${max}${reviewCount ? `, ${reviewCount} reviews` : ''}`}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...rest}
    >
      <span className="relative inline-flex" aria-hidden>
        <span className="text-border-strong inline-flex">
          {Array.from({ length: max }).map((_, i) => (
            <Star key={i} width={sz} height={sz} strokeWidth={1.5} />
          ))}
        </span>
        <span
          className="text-primary pointer-events-none absolute inset-y-0 left-0 inline-flex overflow-hidden"
          style={{ width: `${(filled / max) * 100}%` }}
        >
          {Array.from({ length: max }).map((_, i) => (
            <Star key={i} width={sz} height={sz} strokeWidth={1.5} fill="currentColor" />
          ))}
        </span>
      </span>
      {reviewCount !== undefined && (
        <span className="font-body text-body-sm text-muted">({reviewCount})</span>
      )}
    </div>
  );
});
