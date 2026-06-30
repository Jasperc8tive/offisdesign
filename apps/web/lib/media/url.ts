import { apiConfig } from '../api/config';

/**
 * Neutral warm-grey 8×10 SVG used as the `next/image` blur placeholder when the
 * CMS hasn't pre-computed a per-asset thumbnail. Matches the brand placeholder
 * tone so the blur-up doesn't flash a foreign colour.
 */
export const MEDIA_BLUR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VjZTRkOSIvPjwvc3ZnPg==';

/**
 * Resolve a media id (the storefront API references images by id, never by URL)
 * to an absolute CDN URL.
 *
 * Returns `undefined` when no media host is configured — local dev and any
 * environment before media is wired — so every call site falls back to the
 * brand placeholder and the UI looks identical to today. Set
 * `NEXT_PUBLIC_MEDIA_HOSTNAME` (and allow-list it in next.config) to switch real
 * photography on storefront-wide with no further code changes.
 *
 * Convention: `https://<host>/<mediaId>`. If your CDN serves assets under a
 * different path or with an extension, adjust the template here — it's the one
 * place the id→URL mapping lives.
 */
export function resolveMediaUrl(mediaId: string | null | undefined): string | undefined {
  if (!mediaId) return undefined;
  const host = apiConfig.mediaHostname;
  if (!host) return undefined;
  return `https://${host}/${encodeURIComponent(mediaId)}`;
}
