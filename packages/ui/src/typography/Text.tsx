import * as React from 'react';
import { cn } from '../internal/cn';

type Size = 'body' | 'sm' | 'caption';
type Tone = 'default' | 'muted' | 'inverse' | 'primary';

const sizeMap: Record<Size, string> = {
  body: 'text-body',
  sm: 'text-body-sm',
  caption: 'text-caption',
};

const toneMap: Record<Tone, string> = {
  default: 'text-text',
  muted: 'text-muted',
  inverse: 'text-on-dark',
  primary: 'text-primary',
};

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: Size;
  tone?: Tone;
  as?: 'p' | 'span' | 'div' | 'label';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

const weightMap = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(function Text(
  { size = 'body', tone = 'default', as: Tag = 'p', weight = 'regular', className, ...rest },
  ref,
) {
  const Component = Tag as 'p';
  return (
    <Component
      ref={ref}
      className={cn('font-body', sizeMap[size], toneMap[tone], weightMap[weight], className)}
      {...rest}
    />
  );
});
