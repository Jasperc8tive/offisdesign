import * as React from 'react';
import { cn } from '../internal/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'bg-background font-body text-body text-secondary placeholder:text-muted w-full resize-y rounded-sm border px-3 py-2',
        'duration-base focus:shadow-focus transition-colors focus:outline-none',
        invalid
          ? 'border-primary focus:border-primary'
          : 'border-border-strong focus:border-accent',
        className,
      )}
      {...rest}
    />
  );
});
