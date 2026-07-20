import { NextResponse } from 'next/server';
import { getProductDetails } from '@/lib/cj';
import { parseCjUrl } from '@/lib/product-overrides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VariantImg = { vid: string; color: string; image: string; sku?: string };

/** Full variant detail returned to the frontend for import. */
type VariantDetail = {
  vid: string;
  sku?: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  image?: string;
};

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

/**
 * GET /api/admin/cj/images?url=https://www.cjdropshipping.com/product/...
 *   OR ?pid=PRODUCT_ID
 *
 * Strategies (in order):
 *   1. CJ official API       — requires CJ_API_KEY + CJ_API_EMAIL env vars
 *   2. CJ internal product API — calls the same JSON endpoint their frontend uses
 *   3. HTML scraping          — __NEXT_DATA__ JSON → og:image meta → regex
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

  // ── Strategy 1: CJ official API (needs credentials) ─────────────────
  if (process.env.CJ_API_KEY && process.env.CJ_API_EMAIL && pid) {
    try {
      const data: any = await getProductDetails(pid);
      const result = parseApiResponse(pid, data);
      if (result.productImages.length > 0) return NextResponse.json(result);
      // Auth worked but no images — fall through to scraping
    } catch (e: any) {
      // Credentials are set but auth/query failed — return the real error
      return NextResponse.json(
        { error: `CJ API error: ${e.message}` },
        { status: 502 }
      );
    }
  }

  // ── Strategy 2: CJ internal product API (no credentials needed) ──────
  // This is the JSON endpoint CJ's own Next.js frontend calls.
  if (pid) {
    try {
      const result = await fetchFromCjInternalApi(pid);
      if (result.productImages.length > 0 || result.variantImages.length > 0) {
        return NextResponse.json(result);
      }
    } catch {
      // Fall through to HTML scraping
    }
  }

  // ── Strategy 3: Scrape the product page HTML ─────────────────────────
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
          error: 'CJ_API_REQUIRED',
        },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── CJ internal product API ───────────────────────────────────────────
// CJ's own frontend fetches product details from this endpoint (no merchant auth).
async function fetchFromCjInternalApi(
  pid: string
): Promise<{ pid: string; productImages: string[]; variantImages: VariantImg[]; variantDetails: VariantDetail[] }> {
  // Try multiple known internal endpoint patterns
  const endpoints = [
    `https://www.cjdropshipping.com/api/product/v1/productDetail?productId=${pid}`,
    `https://www.cjdropshipping.com/api/product/v1/productList?productId=${pid}`,
    `https://app.cjdropshipping.com/api/v1/shopping/product/detail?productId=${pid}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { ...BROWSER_HEADERS, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) continue;
      const json = await res.json();
      // CJ API responses wrap data in .data or .result
      const product = json?.data ?? json?.result ?? json;
      if (!product) continue;
      const result = parseApiResponse(pid, product);
      if (result.productImages.length > 0) return result;
    } catch {
      continue;
    }
  }

  return { pid, productImages: [], variantImages: [], variantDetails: [] };
}

// ── Parse the CJ API / internal API response ──────────────────────────
function parseApiResponse(pid: string, data: any) {
  const seen = new Set<string>();
  const productImages: string[] = [];

  function addImg(img: any) {
    const u =
      typeof img === 'string'
        ? img.trim()
        : img?.imageUrl || img?.url || img?.src || '';
    if (u && !seen.has(u)) { seen.add(u); productImages.push(u); }
  }

  addImg(data?.productImage);
  addImg(data?.mainImage);
  addImg(data?.image);

  const imgSet =
    data?.productImageSet ??
    data?.imageList ??
    data?.images ??
    data?.productImages ??
    data?.gallery ??
    [];
  if (Array.isArray(imgSet)) imgSet.forEach(addImg);

  const rawVariants: any[] =
    data?.variants ?? data?.variantList ?? data?.skus ?? data?.variantDetails ?? [];

  const variantImages: VariantImg[] = [];
  const variantDetails: VariantDetail[] = [];

  if (Array.isArray(rawVariants)) {
    rawVariants.forEach((v: any) => {
      const vid   = v.vid || v.variantId || v.id || `v-${Math.random().toString(36).slice(2)}`;
      const sku   = (v.variantSku || v.sku || '').trim() || undefined;
      const img   = (v.variantImage || v.image || v.imageSrc || '').trim() || undefined;
      const rawPrice = v.variantSellPrice ?? v.sellPrice ?? v.price ?? v.salePrice;
      const price = rawPrice != null ? (parseFloat(String(rawPrice)) || undefined) : undefined;

      // ── Extract color + size from variantProperty / attrs ──
      let color: string | undefined;
      let size: string | undefined;

      const rawProps = v.variantProperty ?? v.properties ?? v.attrs ?? v.specifications;
      const props: any[] = Array.isArray(rawProps) ? rawProps : [];
      props.forEach((p: any) => {
        const title = (p.title || p.titleEn || p.key || p.name || '').toLowerCase();
        const val   = (p.value || p.name || p.nameEn || '').trim();
        if (!val) return;
        if (/colo(u?)r|颜色|색상/.test(title)) color = val;
        else if (/size|尺|型|サイズ|taille/.test(title)) size = val;
      });

      // ── Fallback: parse the variant name string ──
      if (!color && !size) {
        const raw = (v.variantNameEn || v.variantName || v.name || '').trim();
        if (raw) {
          const sizeRe = /^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|One\s*Size|\d+M|\d+Y|\d+T|\d+\s*(cm|in|kg|oz))$/i;
          const skipWords = /^(and|or|in|of|for|the|a|an|with|long|short|sleeve|women|men|baby|maternity|nursing|style|fashion|autumn|winter|spring|summer)$/i;

          // Try slash or comma separator first (e.g. "Camel/XXL" or "Camel, XXL")
          const parts = raw.split(/[\/,]/).map((s: string) => s.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const last = parts[parts.length - 1];
            if (sizeRe.test(last)) {
              size = last;
              // Color = last meaningful word of the previous part
              const prevWords = parts[parts.length - 2].split(/\s+/);
              color = prevWords[prevWords.length - 1];
            } else {
              color = parts[0];
              size  = parts.slice(1).join(' ');
            }
          } else {
            // Single long string (e.g. "...Hoodie Camel XXL") — scan from the end
            const words = raw.split(/\s+/);
            const last  = words[words.length - 1];
            const prev  = words.length >= 2 ? words[words.length - 2] : '';

            if (sizeRe.test(last)) {
              size = last;
              // Use second-to-last word as color if it looks like a color name
              if (prev && !skipWords.test(prev)) color = prev;
            } else if (sizeRe.test(raw)) {
              size = raw;
            } else {
              // Use last word as the most specific descriptor (often color)
              color = words[words.length - 1];
            }
          }
        }
      }

      const name = (v.variantNameEn || v.variantName || v.name ||
        [color, size].filter(Boolean).join(' / ') || '').trim();

      // ── Collect image for the image-picker section ──
      if (img) {
        const existingColor = color || v.variantName || v.variantNameEn || v.name || '';
        variantImages.push({ vid, color: existingColor, sku: sku || '', image: img });
        addImg(img);
      }

      variantDetails.push({ vid, sku, name, color, size, price, image: img });
    });
  }

  return { pid, productImages, variantImages, variantDetails };
}

// ── Scrape a CJ product page for image URLs ──────────────────────────
async function scrapeFromPage(
  pageUrl: string,
  pid: string
): Promise<{ pid: string; productImages: string[]; variantImages: VariantImg[]; variantDetails: VariantDetail[] }> {
  const res = await fetch(pageUrl, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(12_000),
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`CJ page returned HTTP ${res.status}`);
  const html = await res.text();

  const seen = new Set<string>();
  const productImages: string[] = [];
  const variantImages: VariantImg[] = [];
  let variantDetails: VariantDetail[] = [];

  function addImg(u: string) {
    const trimmed = u.trim();
    const clean = trimmed.split('?')[0];
    if (clean && !seen.has(clean)) { seen.add(clean); productImages.push(trimmed); }
  }

  // ── Try __NEXT_DATA__ ────────────────────────────────────────────────
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const props = nd?.props?.pageProps ?? nd?.props?.initialProps ?? {};
      const product =
        props?.detail ??
        props?.product ??
        props?.productInfo ??
        props?.productDetail ??
        props?.data ??
        null;

      if (product) {
        const { productImages: pi, variantImages: vi, variantDetails: vd } = parseApiResponse(pid, product);
        pi.forEach((u) => addImg(u));
        vi.forEach((v) => {
          if (!variantImages.some((x) => x.image === v.image)) variantImages.push(v);
        });
        if (vd.length > 0) variantDetails = vd;
      }
    } catch {
      // Fall through
    }
  }

  // ── Try any inline JSON blobs that look like product data ────────────
  if (productImages.length === 0) {
    const scriptBlocks = html.match(/<script[^>]*>([\s\S]{50,50000}?)<\/script>/g) || [];
    for (const block of scriptBlocks) {
      if (!block.includes('cjdropshipping')) continue;
      try {
        // Find JSON object/array boundaries
        const jsonMatch = block.match(/\{[\s\S]+\}/);
        if (!jsonMatch) continue;
        const obj = JSON.parse(jsonMatch[0]);
        const { productImages: pi } = parseApiResponse(pid, obj);
        if (pi.length > 0) { pi.forEach((u) => addImg(u)); break; }
      } catch { continue; }
    }
  }

  // ── Extract og:image and twitter:image meta tags ─────────────────────
  // These are always server-rendered — guaranteed to have at least the main image.
  if (productImages.length === 0) {
    const metaPatterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/gi,
    ];
    for (const re of metaPatterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        if (m[1] && !m[1].startsWith('data:')) addImg(m[1]);
      }
    }
  }

  // ── Regex: every CJ CDN image URL in the HTML ────────────────────────
  if (productImages.length === 0) {
    const re =
      /https:\/\/(?:cf|img|cdn)\.cjdropshipping\.com\/[^"'\s),>\]]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s),>\]]*)?/gi;
    for (const u of html.match(re) || []) addImg(u);
  }

  // ── Broader image regex as last resort ──────────────────────────────
  if (productImages.length === 0) {
    const re = /https:\/\/[^"'\s]+cjdropshipping[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi;
    for (const u of html.match(re) || []) addImg(u);
  }

  return { pid, productImages, variantImages, variantDetails };
}
