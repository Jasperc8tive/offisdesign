/**
 * Tiny localStorage wrapper that is safe to import in SSR contexts. All
 * reads return the default when `window` is not defined (server, edge,
 * tests without DOM).
 */
export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Notify peers in the same tab so providers can re-read.
    window.dispatchEvent(new CustomEvent(`local-store:${key}`));
  } catch {
    // Quota or privacy mode — silently drop.
  }
}

export function subscribe(key: string, listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const event = `local-store:${key}`;
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) listener();
  };
  window.addEventListener(event, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener('storage', onStorage);
  };
}
