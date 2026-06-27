import type { MetadataRoute } from 'next';
import { catalogService, cmsService } from '../lib/api/services';
import { apiConfig } from '../lib/api/config';

const STATIC = ['/', '/search', '/journal', '/about', '/account/login'];

/**
 * Dynamic sitemap. Pulls product, collection, and blog slugs from the API at
 * request time. We swallow API errors so a transient backend issue doesn't
 * break the sitemap response — search engines retry on next crawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = apiConfig.webUrl.replace(/\/$/, '');
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));

  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  const [products, collections, posts] = await Promise.all([
    safe(() => catalogService.listProducts({ pageSize: 100 }), { data: [] } as never),
    safe(() => catalogService.listCollections({ pageSize: 100 }), { data: [] } as never),
    safe(() => cmsService.posts({ pageSize: 100 }), { data: [] } as never),
  ]);

  for (const p of products.data) {
    entries.push({
      url: `${base}/products/${encodeURIComponent(p.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }
  for (const c of collections.data) {
    entries.push({
      url: `${base}/search?collection=${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }
  for (const p of posts.data) {
    entries.push({
      url: `${base}/journal/${encodeURIComponent(p.slug)}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }
  return entries;
}
