import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, homepageOrgJsonLd, productJsonLd, websiteJsonLd } from './schemas';

describe('JSON-LD schemas', () => {
  it('homepageOrgJsonLd is a valid Organization', () => {
    const org = homepageOrgJsonLd();
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('OFFISDESIGN');
    expect(org.url).toMatch(/^http/);
  });

  it('websiteJsonLd includes a SearchAction', () => {
    const site = websiteJsonLd();
    expect(site['@type']).toBe('WebSite');
    expect(site.potentialAction['@type']).toBe('SearchAction');
    expect(site.potentialAction.target).toContain('search?q=');
  });

  it('productJsonLd formats price in major units', () => {
    const product = productJsonLd({
      name: 'Branch sofa',
      slug: 'branch-sofa',
      priceAmount: 129_900,
      priceCurrency: 'NGN',
    });
    expect(product['@type']).toBe('Product');
    expect(product.offers.price).toBe('1299.00');
    expect(product.offers.priceCurrency).toBe('NGN');
    expect(product.offers.availability).toContain('InStock');
  });

  it('breadcrumbJsonLd lists items with positions', () => {
    const crumbs = breadcrumbJsonLd([
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/search' },
      { label: 'Branch sofa', href: '/products/branch-sofa' },
    ]);
    expect(crumbs.itemListElement).toHaveLength(3);
    expect(crumbs.itemListElement[0]?.position).toBe(1);
    expect(crumbs.itemListElement[2]?.name).toBe('Branch sofa');
  });
});
