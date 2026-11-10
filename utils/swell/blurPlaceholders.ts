// utils/swell/blurPlaceholders.ts
// Real blur-up previews for product/category tiles.
//
// For each Swell image we fetch an 8px-wide version from Swell's own CDN
// (`?width=8`, ~200-350 bytes) and inline it as a base64 data URL. next/image
// shows it blurred instantly while the full image loads, so a cold load shows
// a soft preview of the actual photo instead of an empty box.
//
// Runs only server-side, inside getStaticProps - i.e. when a page is built or
// regenerated in the background (ISR), never while a visitor is waiting on a
// cached page. Results are memoised per server instance and each fetch is
// capped, so a slow/failed preview simply means "no blur" for that tile.

const SWELL_HOST = 'cdn.swell.store';
const PREVIEW_WIDTH = 8;
// Swell creates each tiny variant on its first request (slow when many run at once),
// then serves it from its CDN in ~0.1s - so this mainly covers the one-off first run.
const FETCH_TIMEOUT_MS = 3000;
const MAX_CACHE_ENTRIES = 2000;

const cache = new Map<string, string | null>();

const isSwellImage = (url?: string): url is string => {
  if (!url) return false;
  try {
    return new URL(url).hostname === SWELL_HOST;
  } catch {
    return false;
  }
};

export async function getBlurDataURL(url?: string): Promise<string | null> {
  if (!isSwellImage(url)) return null;
  if (cache.has(url)) return cache.get(url) ?? null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let result: string | null = null;

  try {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}width=${PREVIEW_WIDTH}`, { signal: controller.signal });
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.startsWith('image/')) {
      const buf = Buffer.from(await res.arrayBuffer());
      // Guard: a real 8px preview is tiny; anything big means resizing didn't apply.
      if (buf.length > 0 && buf.length < 4096) {
        result = `data:${type.split(';')[0]};base64,${buf.toString('base64')}`;
      }
    }
  } catch {
    result = null; // timeout / network error -> no blur for this tile
  } finally {
    clearTimeout(timer);
  }

  // Only remember successes, so a transient failure is retried next regeneration.
  if (result) {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
    cache.set(url, result);
  }
  return result;
}

/**
 * Returns a copy of `items` where the first `limit` items with a Swell image
 * get a `blurDataURL`. Fetches run in parallel.
 */
export async function withBlurPlaceholders<T extends { image?: string }>(
  items: T[],
  limit = items.length
): Promise<(T & { blurDataURL?: string })[]> {
  return Promise.all(
    items.map(async (item, i) => {
      if (i >= limit) return item;
      const blurDataURL = await getBlurDataURL(item.image);
      return blurDataURL ? { ...item, blurDataURL } : item;
    })
  );
}
