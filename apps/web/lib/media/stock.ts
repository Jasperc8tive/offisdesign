/**
 * Curated royalty-free editorial photography (Brand Bible §28) used in the
 * marketing/editorial slots until original OFFISDESIGN photography exists.
 *
 * Source: Unsplash (free for commercial use under the Unsplash License — no
 * attribution required, no watermarks). Each image was selected to reinforce the
 * premium, professional, contemporary, minimal workspace identity: bright,
 * architectural, real office environments. Hosts are allow-listed in
 * next.config.mjs and served through the Next image pipeline (AVIF/WebP,
 * responsive, lazy except LCP).
 *
 * A resolved CMS `mediaId` always overrides these, so swapping in real
 * photography later requires no code changes.
 */
const UNSPLASH = 'https://images.unsplash.com';

export interface StockImage {
  src: string;
  alt: string;
}

export const STOCK = {
  /** Homepage hero (LCP) — premium open-plan office with glass meeting rooms. */
  hero: {
    src: `${UNSPLASH}/photo-1497366754035-f200968a6e72?q=80&w=1920&auto=format&fit=crop`,
    alt: 'Modern open-plan office with glass-walled meeting rooms',
  },
  /** Brand story — bright collaborative workspace with a team at work. */
  brandStory: {
    src: `${UNSPLASH}/photo-1604328698692-f76ea9498e76?q=80&w=1600&auto=format&fit=crop`,
    alt: 'Team collaborating in a bright, plant-filled modern workspace',
  },
  /** Header mega-menu featured — contemporary meeting room. */
  megaFeatured: {
    src: `${UNSPLASH}/photo-1497366811353-6870744d04b2?q=80&w=640&auto=format&fit=crop`,
    alt: 'Contemporary meeting room with floor-to-ceiling windows',
  },
} satisfies Record<string, StockImage>;
