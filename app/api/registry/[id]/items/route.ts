import { NextResponse } from 'next/server';
import {
  addRegistryItem, removeRegistryItem, verifyRegistryPin, getRegistryItems, ensureRegistrySchema
} from '@/lib/db-registry';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: add an item to the registry (PIN required)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  if (!rateLimit(`registry:items:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  try {
    await ensureRegistrySchema();
    const { pin, productId, variantId, qtyWanted, note } = await req.json();
    if (!pin || !productId) {
      return NextResponse.json({ error: 'pin and productId are required.' }, { status: 400 });
    }
    const valid = await verifyRegistryPin(params.id, String(pin));
    if (!valid) return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 });

    const item = await addRegistryItem({
      registryId: params.id, productId, variantId: variantId || null,
      qtyWanted: qtyWanted || 1, note,
    });
    const items = await getRegistryItems(params.id);
    return NextResponse.json({ item, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: remove an item (PIN required)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { pin, itemId } = await req.json();
    if (!pin || !itemId) {
      return NextResponse.json({ error: 'pin and itemId are required.' }, { status: 400 });
    }
    const valid = await verifyRegistryPin(params.id, String(pin));
    if (!valid) return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 });

    await removeRegistryItem(Number(itemId), params.id);
    const items = await getRegistryItems(params.id);
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
