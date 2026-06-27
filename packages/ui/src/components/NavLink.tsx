import * as React from 'react';
import { cn } from '../internal/cn';

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { active, className, children, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'font-body text-body-sm duration-base ease-standard relative inline-flex items-center font-semibold uppercase tracking-wide transition-colors',
        active ? 'text-primary' : 'text-secondary hover:text-primary',
        'after:bg-primary after:duration-base after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:transition-transform',
        active ? 'after:scale-x-100' : 'hover:after:scale-x-100',
        'focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2',
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
});
