import { NextResponse } from 'next/server';
import { syncAllFromCj } from '@/lib/cj-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Scheduled CJ sync.
 *
 * SCHEDULE: registered in vercel.json as "0 6 * * *" — once daily at 06:00 UTC.
 * Vercel's Hobby plan permits only one run per day per cron; anything more
 * frequent fails the build outright. vercel.json is strict JSON schema and
 * rejects unknown keys (including "comment"), which is why this note lives
 * here rather than beside the schedule.
 *
 * Because daily leaves stock up to 24h stale, POST /api/admin/cj/sync runs the
 * same job on demand from admin.
 *
 * Sits under /api/cron rather than /api/admin because Vercel's scheduler can't
 * send Basic Auth. It's protected by CRON_SECRET instead: Vercel sends
 * `Authorization: Bearer $CRON_SECRET` automatically on scheduled invocations.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    // Without a secret this endpoint would be world-callable. Refuse rather
    // than run an unauthenticated job that writes to the product catalogue.
    console.error('[cron/cj-sync] CRON_SECRET is not set — refusing to run');
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured. Set it in Vercel before enabling the cron job.' },
      { status: 500 }
    );
  }

  try {
    const result = await syncAllFromCj({ syncPhotos: true });
    console.log(
      `[cron/cj-sync] checked ${result.checked}/${result.totalLinked}, ` +
      `${result.changed.length} changed, ${result.errors.length} errors`
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[cron/cj-sync] failed:', e?.message);
    return NextResponse.json({ error: e?.message || 'Sync failed' }, { status: 500 });
  }
}
