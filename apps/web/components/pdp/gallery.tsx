'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AspectRatio, Grid } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';

interface GalleryImage {
  id: string;
  src?: string;
  alt: string;
  /** Optional pre-computed blur placeholder for above-the-fold image. */
  blurDataURL?: string;
}

/** 1×1 neutral data URL used when CMS hasn't pre-computed a blur thumbnail. */
const DEFAULT_BLUR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VjZTRkOSIvPjwvc3ZnPg==';

/**
 * PDP gallery. Renders the active image at 4:5 with hover zoom and a strip of
 * up to four thumbnails. We don't pull real image URLs from CMS yet (Stage 11
 * media wiring), so the slot defaults to the brand placeholder if `src` is
 * absent. Accessibility:
 *   - Active image announced via `aria-roledescription="image"`.
 *   - Thumbnails are buttons with `aria-pressed` for the active state.
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const safe = images.length > 0 ? images : [{ id: 'placeholder', alt: 'Product photo' }];
  const [activeId, setActiveId] = useState<string>(safe[0]!.id);
  const active = safe.find((i) => i.id === activeId) ?? safe[0]!;

  return (
    <div className="space-y-2">
      <AspectRatio
        ratio={4 / 5}
        className="bg-primary-subtle group relative cursor-zoom-in overflow-hidden rounded-md"
        aria-roledescription="image"
        aria-label={active.alt}
      >
        {active.src ? (
          <Image
            src={active.src}
            alt={active.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            placeholder="blur"
            blurDataURL={active.blurDataURL ?? DEFAULT_BLUR}
            className="duration-base ease-standard object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="text-secondary flex h-full w-full items-center justify-center">
            {active.alt}
          </div>
        )}
      </AspectRatio>
      {safe.length > 1 && (
        <Grid cols={4} gap={2}>
          {safe.slice(0, 4).map((img) => {
            const isActive = img.id === activeId;
            return (
              <button
                key={img.id}
                type="button"
                aria-label={`Show ${img.alt}`}
                aria-pressed={isActive}
                onClick={() => setActiveId(img.id)}
                className={cn(
                  'focus-visible:shadow-focus rounded-sm transition-shadow focus-visible:outline-none',
                  isActive ? 'ring-primary ring-2' : 'ring-0',
                )}
              >
                <AspectRatio ratio={1} className="bg-primary-subtle rounded-sm">
                  {img.src && (
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 1024px) 12vw, 25vw"
                      placeholder="blur"
                      blurDataURL={img.blurDataURL ?? DEFAULT_BLUR}
                      className="object-cover"
                    />
                  )}
                </AspectRatio>
              </button>
            );
          })}
        </Grid>
      )}
    </div>
  );
}
