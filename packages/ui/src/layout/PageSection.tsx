import * as React from 'react';
import { cn } from '../internal/cn';
import { Container } from './Container';

type Variant = 'contained' | 'bleed' | 'wide';
type Padding = 'default' | 'compact' | 'spacious' | 'none';

export interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
  /**
   * contained — wraps children in the 1120px Container (default).
   * bleed     — full viewport width, no horizontal constraint. Use for hero,
   *             editorial splits, full-bleed imagery, and promo banners.
   * wide      — 1440px max-width container for extra-wide editorial layouts.
   */
  variant?: Variant;
  /**
   * Vertical padding preset matching the spacing token rhythm.
   * default   — py-16 / md:py-20 (64px / 80px) — standard section spacing.
   * compact   — py-8 / md:py-12  (32px / 48px) — trust strips, announcement rows.
   * spacious  — py-20 / md:py-32 (80px / 128px) — hero-scale moments.
   * none      — strips all vertical padding; caller controls spacing.
   */
  padding?: Padding;
}

const paddingMap: Record<Padding, string> = {
  default: 'py-16 md:py-20',
  compact: 'py-8 md:py-12',
  spacious: 'py-20 md:py-32',
  none: '',
};

export const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(function PageSection(
  { as: Tag = 'section', variant = 'contained', padding = 'default', className, children, ...rest },
  ref,
) {
  const Component = Tag as 'section';

  if (variant === 'bleed') {
    return (
      <Component ref={ref as never} className={cn(paddingMap[padding], className)} {...rest}>
        {children}
      </Component>
    );
  }

  if (variant === 'wide') {
    return (
      <Component ref={ref as never} className={cn(paddingMap[padding], className)} {...rest}>
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-16">{children}</div>
      </Component>
    );
  }

  return (
    <Component ref={ref as never} className={cn(paddingMap[padding], className)} {...rest}>
      <Container>{children}</Container>
    </Component>
  );
});
