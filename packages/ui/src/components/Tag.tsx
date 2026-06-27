import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../internal/cn';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
  removeLabel?: string;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { onRemove, removeLabel = 'Remove', className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'border-border-strong bg-background font-body text-body-sm text-secondary inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1',
        className,
      )}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="text-muted hover:text-primary focus-visible:ring-primary rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <X width={12} height={12} aria-hidden />
        </button>
      )}
    </span>
  );
});
