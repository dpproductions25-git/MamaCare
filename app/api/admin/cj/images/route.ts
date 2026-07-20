import { NextResponse } from 'next/server';
import { getProductDetails } from '@/lib/cj';
import { parseCjUrl } from '@/lib/product-overrides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VariantImg = { vid: string; color: string; image: string; sku?: string };

/**
 * GET /api/admin/cj/images?url=https://www.cjdropshipping.com/product/...
 *   OR ?pid=PRODUCT_ID
 *
 * Strategy:
 *   1. If CJ_API_KEY + CJ_API_EMAIL are set → use the official CJ API.
 *   2. Otherwise → fetch the CJ product page HTML and scrape image URLs.
 *      This works without any API credentials.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let pid = searchParams.get('pid') || '';
  const rawUrl = searchParams.get('url') || '';

  if (!pid && rawUrl) pid = parseCjUrl(rawUrl).pid || '';
  if (!pid && !rawUrl) {
    return NextResponse.json(
      { error: 'Provide ?url= (a CJ product URL) or ?pid= (a CJ product ID).' },
      { status: 400 }
    );
  }

  // ── Strategy 1: CJ API (needs credentials) ──────────────────────────
  if (process.env.CJ_API_KEY && process.env.CJ_API_EMAIL && pid) {
    try {
      const data: any = await getProductDetails(pid);
      return NextResponse.json(parseApiResponse(pid, data));
    } catch {
      // Fall through to scraping
    }
  }

  // ── Strategy 2: Scrape the CJ product page ───────────────────────────
  // Build a canonical CJ URL to fetch. If the caller passed a full URL, use
  // it directly; otherwise reconstruct from the PID (best-effort).
  const pageUrl =
    rawUrl ||
    (pid ? `https://www.cjdropshipping.com/product/-p-${pid}.html` : '');

  if (!pageUrl) {
    return NextResponse.json(
      { error: 'Could not determine the CJ product page URL.' },
      { status: 400 }
    );
  }

  try {
    const result = await scrapeFromPage(pageUrl, pid);
    if (result.productImages.length === 0 && result.variantImages.length === 0) {
      return NextResponse.json(
        {
          error:
            'No images found on the CJ page. ' +
            'Make sure the URL is a direct CJ product link, or set CJ_API_EMAIL ' +
            'and CJ_API_KEY in your Vercel environment variables for API-based fetching.'
        },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── Parse the CJ API response ────────────────────────────────────────
function parseApiResponse(pid: string, data: any) {
  const seen = new Set<string>();
  const productImages: string[] = [];

  function addImg(img: any) {
    const u =
      typeof img === 'string'
        ? img.trim()
        : img?.imageUrl || img?.url || '';
    if (u && !seen.has(u)) { seen.add(u); productImages.push(u); }
  }

  addImg(data?.productImage);
  const imgSet =
    data?.productImageSet ?? data?.imageList ?? data?.images ?? data?.productImages ?? [];
  if (Array.isArray(imgSet)) imgSet.forEach(addImg);

  const variants: any[] =
    data?.variants ?? data?.variantList ?? data?.skus ?? [];

  const variantImages: VariantImg[] = [];
  if (Array.isArray(variants)) {
    variants.forEach((v: any) => {
      const img = (v.variantImage || v.image || '').trim();
      if (!img) return;
      variantImages.push({
        vid:   v.vid || v.variantId || v.id || '',
        color: v.variantName || v.variantNameEn || v.name || '',
        sku:   v.variantSku || v.sku || '',
        image: img
      });
      addImg(img);
    });
  }

  return { pid, productImages, variantImages };
}

// ── Scrape a CJ product page for image URLs ──────────────────────────
async function scrapeFromPage(
  pageUrl: string,
  pid: string
): Promise<{ pid: string; productImages: string[]; variantImages: VariantImg[] }> {
  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    signal: AbortSignal.timeout(10_000)
  });

  if (!res.ok) throw new Error(`CJ page returned ${res.status}`);
  const html = await res.text();

  const seen = new Set<string>();
  const productImages: string[] = [];
  const variantImages: VariantImg[] = [];

  function addImg(u: string) {
    const clean = u.trim().split('?')[0];
    if (clean && !seen.has(clean)) { seen.add(clean); productImages.push(u.trim()); }
  }

  // ── Try __NEXT_DATA__ (CJ site is Next.js) ──────────────────────────
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      // CJ's page props can sit in different places depending on the route
      const props =
        nd?.props?.pageProps ??
        nd?.props?.initialProps ??
        {};
      const product =
        props?.detail ??
        props?.product ??
        props?.productInfo ??
        props?.productDetail ??
        null;

      if (product) {
        // Main / gallery images
        const imgSet =
          product.productImageSet ??
          product.imageList ??
          product.images ??
          product.productImages ??
          [];
        if (product.productImage) addImg(product.productImage);
        if (Array.isArray(imgSet)) imgSet.forEach((x: any) => addImg(typeof x === 'string' ? x : x?.url || ''));

        // Variant images
        const vList =
          product.variants ??
          product.variantList ??
          product.skus ??
          [];
        if (Array.isArray(vList)) {
          vList.forEach((v: any) => {
            const img = (v.variantImage || v.image || '').trim();
            if (!img) return;
            variantImages.push({
              vid:   v.vid || v.variantId || v.id || '',
              color: v.variantName || v.variantNameEn || v.name || '',
              sku:   v.variantSku || v.sku || '',
              image: img
            });
            addImg(img);
          });
        }
      }
    } catch {
      // __NEXT_DATA__ parse failed — fall through to regex
    }
  }

  // ── Regex fallback: grab every cf.cjdropshipping.com image URL ────────
  if (productImages.length === 0) {
    const re =
      /https:\/\/(?:cf|img)\.cjdropshipping\.com\/[^"'\s),>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s),>]*)?/gi;
    const matches = html.match(re) || [];
    matches.forEach((u) => addImg(u));
  }

  return { pid, productImages, variantImages };
}
