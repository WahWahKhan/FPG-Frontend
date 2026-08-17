// /utils/swell/taxonomyCache.ts
// Tiny in-memory TTL cache, scoped to category/series taxonomy lookups only.
// Do NOT use this for product price/stock data — those must stay live.
// Per-lambda-instance only (resets on cold start); no external infra needed.

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

export const TAXONOMY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number = TAXONOMY_CACHE_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
