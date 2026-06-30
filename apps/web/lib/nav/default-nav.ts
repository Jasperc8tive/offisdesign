import { BRAND_CONTACT } from '../brand/contact';
import { STOCK } from '../media/stock';

export interface DefaultNavItem {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
  featured?: {
    eyebrow?: string;
    title: string;
    lead?: string;
    href: string;
    cta: string;
    imageSrc?: string;
    imageAlt?: string;
  };
}

/**
 * Fallback primary navigation, shown when the CMS `header` navigation is empty.
 * Reflects the OFFISDESIGN office portfolio (Brand Bible §11). Category links use
 * `?q=` text search so they always resolve regardless of catalogue category
 * slugs; admins can replace this with curated links via the CMS.
 */
export const DEFAULT_HEADER_NAV: DefaultNavItem[] = [
  {
    label: 'Furniture',
    href: '/search',
    children: [
      { label: 'Executive desks', href: '/search?q=executive%20desk' },
      { label: 'Ergonomic chairs', href: '/search?q=ergonomic%20chair' },
      { label: 'Workstations', href: '/search?q=workstation' },
      { label: 'Conference tables', href: '/search?q=conference%20table' },
      { label: 'Reception', href: '/search?q=reception' },
      { label: 'Storage', href: '/search?q=storage' },
      { label: 'Office sofas', href: '/search?q=office%20sofa' },
    ],
    featured: {
      eyebrow: 'Workspace planning',
      title: 'Plan your office with us',
      lead: 'From space planning to furniture and professional installation, our team partners with you end to end.',
      href: BRAND_CONTACT.whatsapp,
      cta: 'Book a consultation',
      imageSrc: STOCK.megaFeatured.src,
      imageAlt: STOCK.megaFeatured.alt,
    },
  },
  { label: 'Collections', href: '/collections' },
];
