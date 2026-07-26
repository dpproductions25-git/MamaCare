import { NextResponse } from 'next/server';
import { getShippingSettings, listCoupons, ensureCommerceSchema } from '@/lib/db-commerce';
import { resolveTotals } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only diagnostic for "codes and shipping aren't syncing".
 *
 * Open /api/admin/diagnose/commerce while logged into admin.
 * Optionally test a code:  ?code=SPRING20&subtotal=30
 *
 * Shows what the checkout actually reads, straight from the database.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || undefined;
  const subtotal = Number(searchParams.get('subtotal') || '30');

  const out: any = { checkedAt: new Date().toISOString() };

  try {
    await ensureCommerceSchema();
    out.schema = 'ok';
  } catch (e: any) {
    out.schema = 'FAILED';
    out.schemaError = e.message;
    return NextResponse.json(out, { status: 500 });
  }

  try {
    out.shippingSettings = await getShippingSettings();
    out.note =
      'If shippingSettings shows 50 / 6.99 after you saved different values, the save did not persist.';
  } catch (e: any) {
    out.shippingError = e.message;
  }

  try {
    const coupons = await listCoupons();
    out.couponCount = coupons.length;
    out.coupons = coupons.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      active: c.active,
      expiresAt: c.expires_at,
      minSubtotal: c.min_subtotal,
      maxRedemptions: c.max_redemptions,
      timesRedeemed: c.times_redeemed,
      singleUse: c.single_use,
      issuedTo: c.issued_to,
    }));
  } catch (e: any) {
    out.couponsError = e.message;
  }

  // Live end-to-end test through the exact function checkout uses
  try {
    out.resolveTotalsTest = {
      input: { subtotal, code: code ?? '(none)' },
      output: await resolveTotals(subtotal, code),
    };
  } catch (e: any) {
    out.resolveTotalsError = e.message;
    out.resolveTotalsStack = e.stack;
  }

  return NextResponse.json(out);
}
