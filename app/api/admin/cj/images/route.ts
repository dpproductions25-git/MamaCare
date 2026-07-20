import { NextResponse } from 'next/server';
import { getProductDetails } from '@/lib/cj';
import { parseCjUrl } from '@/lib/product-overrides';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cj/images?pid=PRODUCT_ID
 *   OR ?url=https://www.cjdropshipping.com/product/name-p-PRODUCTID.html
 *
 * Returns all product and variant images from CJ so the admin can pick
 * which ones to use.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let pid = searchParams.get('pid') || '';
  const url = searchParams.get('url') || '';

  // Accept a full CJ URL and extract the PID automatically.
  if (!pid && url) {
    pid = parseCjUrl(url).pid || '';
  }

  if (!pid) {
    return NextResponse.json({ error: 'Provide ?pid= or ?url= (a CJ product URL)' }, { status: 400 });
  }

  try {
    const data: any = await getProductDetails(pid);

    // ── Product-level gallery images ──────────────────────────────────
    const seen = new Set<string>();
    const productImages: string[] = [];

    function addImg(img: any) {
      const u = typeof img === 'string' ? img.trim() : (img?.imageUrl || img?.url || '');
      if (u && !seen.has(u)) { seen.add(u); productImages.push(u); }
    }

    addImg(data?.productImage);
    const imgSet =
      data?.productImageSet ??
      data?.imageList ??
      data?.images ??
      data?.productImages ??
      [];
    if (Array.isArray(imgSet)) imgSet.forEach(addImg);

    // ── Variant images, grouped by colour ────────────────────────────
    const variants: any[] =
      data?.variants ??
      data?.variantList ??
      data?.skus ??
      [];

    type VariantImg = { vid: string; color: string; image: string; sku?: string };
    const variantImages: VariantImg[] = [];

    if (Array.isArray(variants)) {
      variants.forEach((v: any) => {
        const img = (v.variantImage || v.image || '').trim();
        if (!img) return;
        variantImages.push({
          vid: v.vid || v.variantId || v.id || '',
          color: v.variantName || v.variantNameEn || v.name || '',
          sku: v.variantSku || v.sku || '',
          image: img
        });
        // Also add variant images to the general pool so they show up in the picker
        addImg(img);
      });
    }

    return NextResponse.json({ pid, productImages, variantImages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
