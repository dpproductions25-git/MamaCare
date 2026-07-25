import { NextResponse } from 'next/server';
import {
  addRegistryItem, removeRegistryItem, verifyRegistryPin, getRegistryItems,
  setRegistryItemQty, ensureRegistrySchema
} from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Shared: verify PIN, then return the fully enriched item list. */
async function enrichedItemsFor(registryId: string) {
  const rows = await getRegistryItems(registryId);
  return enrichRegistryItems(rows);
}

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
    if (!valid) {
      console.error(`[registry/items POST] PIN verification failed for registry ${params.id}`);
      return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 });
    }

    const item = await addRegistryItem({
      registryId: params.id, productId, variantId: variantId || null,
      qtyWanted: qtyWanted || 1, note,
    });
    return NextResponse.json({ item, items: await enrichedItemsFor(params.id) });
  } catch (e: any) {
    console.error('[registry/items POST]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: change how many of an item the registry owner wants (PIN required)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  if (!rateLimit(`registry:items:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  try {
    await ensureRegistrySchema();
    const { pin, itemId, qtyWanted } = await req.json();
    if (!pin || !itemId || qtyWanted == null) {
      return NextResponse.json({ error: 'pin, itemId and qtyWanted are required.' }, { status: 400 });
    }
    const qty = Number(qtyWanted);
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 99.' }, { status: 400 });
    }
    const valid = await verifyRegistryPin(params.id, String(pin));
    if (!valid) return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 });

    await setRegistryItemQty(Number(itemId), params.id, qty);
    return NextResponse.json({ ok: true, items: await enrichedItemsFor(params.id) });
  } catch (e: any) {
    console.error('[registry/items PATCH]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: remove an item (PIN required)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  if (!rateLimit(`registry:items:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  try {
    await ensureRegistrySchema();
    const { pin, itemId } = await req.json();
    if (!pin || !itemId) {
      return NextResponse.json({ error: 'pin and itemId are required.' }, { status: 400 });
    }
    const valid = await verifyRegistryPin(params.id, String(pin));
    if (!valid) {
      console.error(`[registry/items DELETE] PIN verification failed for registry ${params.id}`);
      return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 });
    }

    await removeRegistryItem(Number(itemId), params.id);
    return NextResponse.json({ ok: true, items: await enrichedItemsFor(params.id) });
  } catch (e: any) {
    console.error('[registry/items DELETE]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
