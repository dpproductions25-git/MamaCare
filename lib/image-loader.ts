/**
 * Image loader for next/image (wired up in next.config.js).
 *
 * Vercel's built-in optimizer is metered. When the monthly image allowance runs
 * out, every image it hasn't already cached returns HTTP 402
 * (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) and shows as a blank box — this
 * took out product galleries, the shop grid and the homepage at once. Most of
 * this store's images come from CJ, whose CDN (Alibaba OSS) resizes on request,
 * so the browser asks the CDN for the width it needs and Vercel isn't involved.
 *
 * Lookups are by width only, which is all next/image passes in.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!/^https?:\/\//i.test(src)) {
    // Local file from /public. The width param is ignored by the file server;
    // it just stops next/image warning that the loader doesn't use the width.
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
  }

  try {
    const u = new URL(src);

    // CJ product photos. Drop any resize params already on the URL (they
    // carried a fixed width) and ask for the width this slot needs. OSS never
    // upscales, so small originals come back at their own size.
    if (u.hostname === 'cf.cjdropshipping.com' || u.hostname === 'oss-cf.cjdropshipping.com') {
      return `${u.origin}${u.pathname}?x-oss-process=image/format,webp,image/resize,w_${width}`;
    }

    // Unsplash resizes via query params.
    if (u.hostname === 'images.unsplash.com') {
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality || 75));
      if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format');
      return u.toString();
    }

    // Google Drive links are normalised to ".../d/<id>=w1600" (lib/image-url.ts).
    if (u.hostname === 'lh3.googleusercontent.com' && /=w\d+$/.test(src)) {
      return src.replace(/=w\d+$/, `=w${width}`);
    }
  } catch {
    /* unparseable URL — fall through and serve it as given */
  }

  return src;
}
