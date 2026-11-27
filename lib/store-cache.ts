/**
 * One shared copy of the storefront's database data.
 *
 * The database bills for the time it's awake, and it only sleeps after a few
 * quiet minutes. Reading it on page views kept it awake around the clock and
 * used up a month's allowance, which took every admin-added product offline.
 * Storefront reads now go through this cache, so the whole site shares one read
 * per hour, and saving in admin clears it straight away.
 *
 * Payments and admin screens do NOT use it — they read the database directly.
 */
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

const STORE_TAG = 'store-data';
const MAX_AGE_SECONDS = 3600;

/**
 * `read` MUST throw when the database fails. A thrown error is never stored; if
 * it returned an empty list instead, the shop would show no products for an
 * hour. Callers apply their fallback outside the cache.
 */
export function cachedRead<T>(key: string, read: () => Promise<T>): () => Promise<T> {
  return unstable_cache(read, [key], { tags: [STORE_TAG], revalidate: MAX_AGE_SECONDS });
}

/** Call after writing anything the storefront reads. */
export function invalidateStoreData() {
  try {
    revalidateTag(STORE_TAG);
    revalidatePath('/', 'layout');
  } catch (e: any) {
    // Outside a web request (a script) there is no cache to clear.
    console.warn('[store-cache] could not invalidate:', e?.message);
  }
}
