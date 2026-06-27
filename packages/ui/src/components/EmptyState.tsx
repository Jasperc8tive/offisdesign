import * as React from 'react';
import { cn } from '../internal/cn';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border-strong bg-background font-body flex flex-col items-center gap-3 rounded-md border border-dashed p-12 text-center',
        className,
      )}
      {...rest}
    >
      {icon && <div className="text-muted">{icon}</div>}
      <p className="font-heading text-h4 text-secondary">{title}</p>
      {description && <p className="text-body text-muted max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
});
