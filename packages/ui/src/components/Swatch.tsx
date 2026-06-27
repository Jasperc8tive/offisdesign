import { cn } from '../internal/cn';

export interface SwatchOption {
  value: string;
  label: string;
  /** Any valid CSS color or background-image (for fabric thumbnails). */
  color?: string;
  imageUrl?: string;
  disabled?: boolean;
}

export interface SwatchProps {
  options: SwatchOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
} as const;

export function Swatch({ options, value, onChange, name, size = 'md', className }: SwatchProps) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.label}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'focus-visible:ring-primary relative rounded-full border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2',
              sizeMap[size],
              selected ? 'border-primary' : 'border-border-strong hover:border-secondary',
              opt.disabled && 'cursor-not-allowed opacity-40',
            )}
            style={{
              background: opt.imageUrl
                ? `url(${opt.imageUrl}) center/cover`
                : (opt.color ?? 'transparent'),
            }}
          />
        );
      })}
    </div>
  );
}
