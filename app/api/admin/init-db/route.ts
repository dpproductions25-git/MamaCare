import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-time DB schema bootstrap.
 *
 * After deploy, visit:  https://YOUR_DOMAIN/api/admin/init-db?secret=YOUR_ADMIN_SECRET
 * It's idempotent — safe to call again later.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    await ensureSchema();
    return NextResponse.json({ ok: true, message: 'Schema ready.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
