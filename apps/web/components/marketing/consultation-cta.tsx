'use client';

import { type ReactNode } from 'react';
import { Button } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';
import { BRAND_CONTACT } from '../../lib/brand/contact';
import { useAnalytics } from '../../lib/providers';

interface Props {
  /** Where this CTA lives — recorded with the analytics event. */
  location: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  trailingIcon?: ReactNode;
  className?: string;
}

/**
 * Consultation call-to-action — the primary B2B lead path (Brand Bible journey:
 * Consultation → Proposal → …). Opens WhatsApp in a new tab and records the
 * click, so the existing checkout flow is never disturbed.
 */
export function ConsultationCta({
  location,
  label = 'Request a consultation',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  trailingIcon,
  className,
}: Props) {
  const { track } = useAnalytics();
  return (
    <a
      href={BRAND_CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track('cta_click', { id: 'consultation', location, href: BRAND_CONTACT.whatsapp })
      }
      className={cn('inline-flex', fullWidth && 'w-full', className)}
    >
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        {...(trailingIcon ? { trailingIcon } : {})}
      >
        {label}
      </Button>
    </a>
  );
}
