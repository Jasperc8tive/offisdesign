import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../internal/cn';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** How many sibling buttons to show on each side of current. */
  siblingCount?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPages(page: number, pageCount: number, sibling: number): Array<number | 'gap'> {
  if (pageCount <= sibling * 2 + 5) return range(1, pageCount);
  const left = Math.max(2, page - sibling);
  const right = Math.min(pageCount - 1, page + sibling);
  const out: Array<number | 'gap'> = [1];
  if (left > 2) out.push('gap');
  out.push(...range(left, right));
  if (right < pageCount - 1) out.push('gap');
  out.push(pageCount);
  return out;
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, pageCount, onPageChange, siblingCount = 1, className, ...rest },
  ref,
) {
  if (pageCount <= 1) return null;
  const pages = buildPages(page, pageCount, siblingCount);
  return (
    <nav ref={ref} aria-label="Pagination" className={cn('font-body', className)} {...rest}>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary inline-flex h-9 w-9 items-center justify-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft width={16} height={16} aria-hidden />
          </button>
        </li>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden className="text-muted px-2">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={cn(
                  'text-body-sm focus-visible:ring-primary inline-flex h-9 min-w-9 items-center justify-center rounded-sm px-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
                  p === page
                    ? 'bg-primary text-on-dark'
                    : 'text-secondary hover:bg-primary-subtle hover:text-primary',
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary inline-flex h-9 w-9 items-center justify-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight width={16} height={16} aria-hidden />
          </button>
        </li>
      </ul>
    </nav>
  );
});
