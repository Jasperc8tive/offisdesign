/**
 * Render `{{ key }}` and `{{ key.subKey }}` placeholders against a JSON
 * payload. Missing keys render as an empty string. No conditionals or loops
 * — intentionally minimal so templates stay legible. Richer rendering can be
 * plugged in later behind the same `renderTemplate` signature.
 */
const PLACEHOLDER = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g;

export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(PLACEHOLDER, (_, path: string) => {
    const value = resolve(vars, path);
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  });
}

function resolve(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = obj;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cursor;
}
