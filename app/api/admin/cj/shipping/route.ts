import { NextResponse } from 'next/server';
import { getFreightOptions } from '@/lib/cj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Shipping rate lookup — what CJ actually charges to ship a given variant to a
 * given country, per carrier.
 *
 * Use it to set your own shipping rates knowingly instead of guessing: compare
 * CJ's real cost against the flat rate you charge in Admin → Shipping.
 *
 * POST { vid, country, zip?, quantity? }
 */
export async function POST(req: Request) {
  try {
    const { vid, country, zip, quantity } = await req.json();

    if (!vid || !country) {
      return NextResponse.json(
        { error: 'A CJ variant id (vid) and destination country code are required.' },
        { status: 400 }
      );
    }

    const options = await getFreightOptions({
      endCountryCode: String(country).toUpperCase(),
      zip: zip ? String(zip) : undefined,
      products: [{ vid: String(vid), quantity: Number(quantity) || 1 }],
    });

    const sorted = [...options].sort(
      (a, b) => (Number(a.logisticPrice) || 0) - (Number(b.logisticPrice) || 0)
    );

    return NextResponse.json({
      count: sorted.length,
      cheapest: sorted[0] ?? null,
      options: sorted.map((o) => ({
        carrier: o.logisticName,
        cost: Number(o.logisticPrice) || 0,
        estimatedDays: o.logisticAging || null,
      })),
    });
  } catch (e: any) {
    console.error('[admin/cj/shipping]', e?.message);
    return NextResponse.json(
      { error: e?.message || 'Could not fetch shipping rates from CJ.' },
      { status: 500 }
    );
  }
}
