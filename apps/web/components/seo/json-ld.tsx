/**
 * Inline JSON-LD <script> for SEO. Server-rendered — no `'use client'` so it
 * lands in the initial HTML and search crawlers see it without executing JS.
 */
export function JsonLd({ payload }: { payload: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
