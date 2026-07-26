import { NextResponse } from 'next/server';
import { resolveTotals } from '@/lib/pricing';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/coupon/validate  { subtotal, code }
 *
 * Returns the real totals for a code so the checkout page can preview an
 * accurate discount. Rate limited because this endpoint would otherwise let
 * someone brute-force guess valid discount codes.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { subtotal, code } = body || {};
  const hasCode = typeof code === 'string' && code.trim().length > 0;

  /**
   * Two different limits, because this endpoint does two different jobs.
   *
   * The cart and checkout call this on mount and on every quantity change just
   * to get accurate shipping — that's a pricing calculation, not a guess, and
   * throttling it made real shipping settings and valid codes silently fall
   * back to hardcoded defaults. Only *code attempts* are a brute-force risk.
   */
  const limitKey = hasCode ? `coupon:try:${ip}` : `coupon:price:${ip}`;
  const [max, windowMs] = hasCode ? [30, 60_000] : [120, 60_000];

  if (!rateLimit(limitKey, max, windowMs)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment and try again.' },
      { status: 429 }
    );
  }

  try {
    const sub = Number(subtotal);
    if (!Number.isFinite(sub) || sub < 0) {
      return NextResponse.json({ error: 'Invalid subtotal.' }, { status: 400 });
    }

    const totals = await resolveTotals(sub, hasCode ? code : null);
    return NextResponse.json(totals);
  } catch (e: any) {
    console.error('[coupon/validate] FAILED:', e?.message, e?.stack);
    return NextResponse.json(
      { error: e?.message || 'Could not calculate totals.' },
      { status: 500 }
    );
  }
}
