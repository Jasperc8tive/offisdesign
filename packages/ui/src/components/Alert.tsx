import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react';
import { cn } from '../internal/cn';

type Variant = 'info' | 'success' | 'warning' | 'error';

const variantMap: Record<Variant, { cls: string; icon: LucideIcon }> = {
  info: {
    cls: 'border-border-strong bg-background text-secondary',
    icon: Info,
  },
  success: {
    cls: 'border-border-strong bg-background text-secondary',
    icon: CheckCircle2,
  },
  warning: {
    cls: 'border-primary bg-primary-subtle text-secondary',
    icon: AlertCircle,
  },
  error: {
    cls: 'border-primary bg-primary text-on-dark',
    icon: AlertCircle,
  },
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: Variant;
  title?: React.ReactNode;
  onDismiss?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = 'info', title, onDismiss, className, children, ...rest },
  ref,
) {
  const { cls, icon: Icon } = variantMap[variant];
  return (
    <div
      ref={ref}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn('font-body flex items-start gap-3 rounded-md border p-4', cls, className)}
      {...rest}
    >
      <Icon width={20} height={20} aria-hidden />
      <div className="flex-1">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        {children && <div className="text-body-sm">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="rounded-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <X width={16} height={16} aria-hidden />
        </button>
      )}
    </div>
  );
});
