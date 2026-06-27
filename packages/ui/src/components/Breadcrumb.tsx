import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../internal/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { items, separator, className, ...rest },
  ref,
) {
  const sep = separator ?? <ChevronRight width={12} height={12} aria-hidden />;
  return (
    <nav
      ref={ref}
      aria-label="Breadcrumb"
      className={cn('font-body text-body-sm', className)}
      {...rest}
    >
      <ol className="text-muted flex flex-wrap items-center gap-2">
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {last || !item.href ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={last ? 'text-secondary' : ''}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="hover:text-primary transition-colors focus-visible:underline focus-visible:outline-none"
                >
                  {item.label}
                </a>
              )}
              {!last && <span aria-hidden>{sep}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
