import type { MetadataRoute } from 'next';
import { apiConfig } from '../lib/api/config';

export default function robots(): MetadataRoute.Robots {
  const base = apiConfig.webUrl.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        // Don't index account, checkout, search-with-query, or the validation env.
        disallow: ['/account', '/checkout', '/cart', '/design'],
        allow: '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
