import * as React from 'react';
import { cn } from '../internal/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-body font-semibold transition duration-base ease-standard ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:shadow-focus ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variantMap: Record<Variant, string> = {
  primary: 'bg-primary text-on-dark hover:bg-primary-hover active:bg-primary-active',
  secondary: 'bg-secondary text-on-dark hover:bg-accent',
  outline:
    'bg-transparent text-secondary border border-border-strong hover:bg-primary-subtle hover:text-primary hover:border-primary',
  ghost: 'bg-transparent text-secondary hover:bg-primary-subtle hover:text-primary',
  link: 'bg-transparent text-primary underline-offset-4 hover:underline px-0',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-body-sm',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-6 text-body',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading,
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        variantMap[variant],
        variant !== 'link' && sizeMap[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
