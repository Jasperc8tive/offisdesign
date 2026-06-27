import * as React from 'react';
import { cn } from '../internal/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { as: Tag = 'div', interactive, className, ...rest },
  ref,
) {
  const Component = Tag as 'div';
  return (
    <Component
      ref={ref}
      className={cn(
        'border-border bg-background rounded-md border shadow-sm',
        interactive &&
          'duration-base ease-standard hover:border-border-strong focus-visible:shadow-focus cursor-pointer transition hover:shadow-md focus-visible:outline-none',
        className,
      )}
      {...rest}
    />
  );
});

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1 p-6 pb-3', className)} {...rest} />;
  },
);

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('p-6 pt-3', className)} {...rest} />;
  },
);

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('border-border flex items-center justify-between border-t p-6', className)}
        {...rest}
      />
    );
  },
);
