/**
 * Loose runtime helpers for inspecting CMS block payloads. The CMS schema
 * stores `payload` as `unknown` (JSON), so each section narrows it on
 * demand. Keep these helpers safe — never throw on a bad payload, just
 * return `undefined` and let the section render its fallback.
 */
export type Block = { id: string; kind: string; position: number; payload: unknown };

export function findBlock<T = Record<string, unknown>>(
  blocks: Block[] | undefined,
  kind: string,
): T | undefined {
  const match = blocks?.find((b) => b.kind === kind);
  return (match?.payload as T) ?? undefined;
}

export function findBlocks<T = Record<string, unknown>>(
  blocks: Block[] | undefined,
  kind: string,
): T[] {
  return (blocks?.filter((b) => b.kind === kind).map((b) => b.payload as T) ?? []) as T[];
}

export function str(payload: unknown, key: string): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}
