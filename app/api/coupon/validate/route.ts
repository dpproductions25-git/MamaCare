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
  if (!rateLimit(`coupon:validate:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a moment.' }, { status: 429 });
  }

  try {
    const { subtotal, code } = await req.json();
    const sub = Number(subtotal);
    if (!Number.isFinite(sub) || sub < 0) {
      return NextResponse.json({ error: 'Invalid subtotal.' }, { status: 400 });
    }

    const totals = await resolveTotals(sub, code);
    return NextResponse.json(totals);
  } catch (e: any) {
    console.error('[coupon/validate]', e);
    return NextResponse.json({ error: 'Could not check that code.' }, { status: 500 });
  }
}
