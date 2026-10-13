/**
 * Inline JSON-LD <script> for SEO. Server-rendered — no `'use client'` so it
 * lands in the initial HTML and search crawlers see it without executing JS.
 */
export function JsonLd({ payload }: { payload: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}

/**
 * JSON for an inline <script>: escape `<` so content such as a product name
 * containing `</script>` can't break out of the tag.
 */
export function serializeJsonLd(payload: object | object[]): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}
