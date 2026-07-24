import { NextResponse } from 'next/server';
import { markItemPurchased, getRegistryItems } from '@/lib/db-registry';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: gifter marks an item as purchased (no PIN needed — public action)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  if (!rateLimit(`registry:purchase:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  try {
    const { itemId, qty = 1 } = await req.json();
    if (!itemId) return NextResponse.json({ error: 'itemId is required.' }, { status: 400 });
    await markItemPurchased(Number(itemId), Number(qty));
    const items = await getRegistryItems(params.id);
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
