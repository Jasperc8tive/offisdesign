import { cn } from '../internal/cn';

type Size = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;

const vMap: Record<Size, string> = {
  1: 'h-1',
  2: 'h-2',
  3: 'h-3',
  4: 'h-4',
  6: 'h-6',
  8: 'h-8',
  12: 'h-12',
  16: 'h-16',
  24: 'h-24',
};

const hMap: Record<Size, string> = {
  1: 'w-1',
  2: 'w-2',
  3: 'w-3',
  4: 'w-4',
  6: 'w-6',
  8: 'w-8',
  12: 'w-12',
  16: 'w-16',
  24: 'w-24',
};

export interface SpacerProps {
  size?: Size;
  axis?: 'vertical' | 'horizontal';
}

export function Spacer({ size = 4, axis = 'vertical' }: SpacerProps) {
  return (
    <span aria-hidden className={cn('block', axis === 'vertical' ? vMap[size] : hMap[size])} />
  );
}
