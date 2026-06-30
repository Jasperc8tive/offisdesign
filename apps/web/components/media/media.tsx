import Image from 'next/image';
import { cn } from '@offisdesign/utils';
import { MEDIA_BLUR, resolveMediaUrl } from '../../lib/media/url';

interface MediaProps {
  /** API media id (product `mediaId`, blog `coverMediaId`, testimonial `imageId`). */
  mediaId?: string | null | undefined;
  /** Meaningful description — usually the product/post title. */
  alt: string;
  /** Responsive `sizes` hint; default assumes full-width. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders imagery by media id with `next/image`. Built to sit inside an
 * `AspectRatio` (which is already `relative overflow-hidden`) whose background is
 * the brand placeholder: when no CDN media resolves — local dev, or before media
 * is wired — this renders nothing and the placeholder shows through, so the UI is
 * identical to today. Configure `NEXT_PUBLIC_MEDIA_HOSTNAME` to switch real
 * photography on everywhere at once.
 */
export function Media({ mediaId, alt, sizes = '100vw', priority = false, className }: MediaProps) {
  const src = resolveMediaUrl(mediaId);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={MEDIA_BLUR}
      className={cn('object-cover', className)}
    />
  );
}
