import { NextResponse } from 'next/server';
import { getProductDetails } from '@/lib/cj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CJ variant lookup helper.
 *
 * Usage:
 *   GET /api/admin/cj/lookup?secret=YOUR_ADMIN_SECRET&pid=YOUR_CJ_PRODUCT_ID
 *
 * Returns the variants for that CJ product so you can pick the right VID
 * to paste into lib/products.ts.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const pid = url.searchParams.get('pid');

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!pid) {
    return NextResponse.json({ error: 'pid query param required' }, { status: 400 });
  }

  try {
    const data: any = await getProductDetails(pid);

    // CJ's response varies by tier — try to surface the most useful fields.
    const variants =
      data?.variants ||
      data?.variantList ||
      data?.skus ||
      (Array.isArray(data) ? data : null);

    return NextResponse.json({
      pid,
      productName: data?.productName || data?.productNameEn || null,
      summary: variants
        ? variants.map((v: any) => ({
            vid: v.vid || v.variantId || v.id,
            sku: v.variantSku || v.sku,
            name: v.variantName || v.name || v.variantNameEn,
            price: v.variantSellPrice || v.sellPrice || v.price,
            image: v.variantImage || v.image,
            inventory: v.inventory || v.stock || v.variantStandard
          }))
        : null,
      raw: data
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
