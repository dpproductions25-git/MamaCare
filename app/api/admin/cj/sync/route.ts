import { NextResponse } from 'next/server';
import { syncAllFromCj, listCostAlerts, acknowledgeCostAlert } from '@/lib/cj-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Manual CJ sync — run it whenever you like from admin.
 *
 * Vercel's Hobby plan allows the scheduled job to run only once per day, so
 * stock can be up to 24h stale. This is the on-demand top-up: hit it after
 * adding products in CJ, or before a promotion, to refresh immediately.
 *
 * Protected by the admin Basic Auth middleware (/api/admin/:path*).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Acknowledge a cost-change alert rather than running a full sync
    if (body?.acknowledge) {
      await acknowledgeCostAlert(String(body.acknowledge));
      return NextResponse.json({ ok: true, acknowledged: body.acknowledge });
    }

    const result = await syncAllFromCj({
      syncPhotos: body?.syncPhotos !== false,
      limit: Number(body?.limit) || 40,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[admin/cj/sync]', e?.message);
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 });
  }
}

/** Current cost-change alerts awaiting review. */
export async function GET() {
  try {
    return NextResponse.json({ alerts: await listCostAlerts() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not load alerts' }, { status: 500 });
  }
}
