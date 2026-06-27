import * as React from 'react';
import { cn } from '../internal/cn';

type Side = 'top' | 'bottom' | 'left' | 'right';

const sideMap: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export interface TooltipProps {
  content: React.ReactNode;
  side?: Side;
  /** Open delay in ms. */
  delay?: number;
  children: React.ReactElement;
}

/**
 * Lightweight CSS-positioned tooltip. For complex positioning needs (collision
 * detection, portals) the eventual Floating UI integration replaces this.
 */
export function Tooltip({ content, side = 'top', delay = 150, children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const id = React.useId();
  const show = () => {
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  const trigger = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  });
  return (
    <span className="relative inline-flex">
      {trigger}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'z-tooltip bg-secondary font-body text-caption text-on-dark duration-fast pointer-events-none absolute whitespace-nowrap rounded-sm px-2 py-1 font-medium shadow-sm transition-opacity',
          sideMap[side],
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
