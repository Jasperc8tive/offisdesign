import * as React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '../internal/cn';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizePx: Record<Size, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface IconProps extends Omit<LucideProps, 'size' | 'ref'> {
  icon: LucideIcon;
  size?: Size;
  /** Accessible label. Omit only for purely decorative icons (paired with aria-hidden). */
  title?: string;
  decorative?: boolean;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon: LucideComp, size = 'md', title, decorative, className, strokeWidth = 1.75, ...rest },
  ref,
) {
  const a11y: React.AriaAttributes & { role?: string } = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': title };
  return (
    <LucideComp
      ref={ref}
      width={sizePx[size]}
      height={sizePx[size]}
      strokeWidth={strokeWidth}
      className={cn('text-current', className)}
      {...a11y}
      {...rest}
    />
  );
});
