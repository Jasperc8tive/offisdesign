import { apiConfig } from '../../lib/api/config';

/** Organization schema for the homepage. */
export function homepageOrgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Offisdesign',
    url: apiConfig.webUrl,
    logo: `${apiConfig.webUrl}/icon.svg`,
    sameAs: [],
    description: 'Furniture made to outlast trends, built in Britain.',
  };
}

/** WebSite schema with a SearchAction so search engines can render a sitelinks search box. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: apiConfig.webUrl,
    name: 'Offisdesign',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${apiConfig.webUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface ProductLikeJsonLdInput {
  name: string;
  slug: string;
  description?: string | null;
  image?: string;
  brand?: string | null;
  priceAmount: number;
  priceCurrency: string;
  availability?: 'InStock' | 'OutOfStock';
  sku?: string;
}

/** Schema.org Product for a PDP. Money in minor units; we convert to major for JSON-LD. */
export function productJsonLd(input: ProductLikeJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description ?? undefined,
    image: input.image,
    brand: input.brand ? { '@type': 'Brand', name: input.brand } : undefined,
    sku: input.sku,
    offers: {
      '@type': 'Offer',
      price: (input.priceAmount / 100).toFixed(2),
      priceCurrency: input.priceCurrency,
      availability: `https://schema.org/${input.availability ?? 'InStock'}`,
      url: `${apiConfig.webUrl}/products/${encodeURIComponent(input.slug)}`,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ label: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href.startsWith('http') ? item.href : `${apiConfig.webUrl}${item.href}`,
    })),
  };
}
