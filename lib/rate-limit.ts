/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * Works per serverless function instance (resets on cold starts).
 * Good enough to block obvious spam/abuse without Redis.
 * For production scale, swap the store for Upstash/Redis.
 */

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key      Unique identifier — e.g. `subscribe:${ip}` or `contact:${ip}`
 * @param limit    Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/**
 * Extracts the real client IP from a Next.js Request.
 * Checks Vercel/CF forwarded headers before falling back to a placeholder.
 */
export function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}
