import * as React from 'react';
import { cn } from '../internal/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<Size, string> = {
  sm: 'h-8 w-8 text-body-sm',
  md: 'h-10 w-10 text-body',
  lg: 'h-12 w-12 text-body',
  xl: 'h-16 w-16 text-h4',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  /** Fallback initials when no src or src fails. */
  initials?: string;
  size?: Size;
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, initials, size = 'md', className, ...rest },
  ref,
) {
  const [loaded, setLoaded] = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;
  return (
    <span
      ref={ref}
      className={cn(
        'bg-primary-subtle font-body text-primary inline-flex select-none items-center justify-center overflow-hidden rounded-full font-semibold',
        sizeMap[size],
        className,
      )}
      {...rest}
    >
      {showImage && (
        <img
          src={src}
          alt={alt ?? ''}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn('h-full w-full object-cover', !loaded && 'opacity-0')}
        />
      )}
      {(!showImage || !loaded) && <span aria-hidden={alt ? true : undefined}>{initials}</span>}
    </span>
  );
});
