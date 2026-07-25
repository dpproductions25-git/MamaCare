import { NextResponse } from 'next/server';
import {
  findRegistryById, getRegistryItems, verifyRegistryPin,
  deleteRegistry, ensureRegistrySchema,
} from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: public view of a registry (for gifters — no PIN needed)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureRegistrySchema();
    const registry = await findRegistryById(params.id);
    if (!registry) return NextResponse.json({ error: 'Registry not found.' }, { status: 404 });

    const rows = await getRegistryItems(params.id);
    const items = await enrichRegistryItems(rows);

    return NextResponse.json({ registry, items });
  } catch (e: any) {
    console.error('[registry GET]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE: the registry owner deletes their own registry.
 *
 * Requires the 4-digit PIN. registry_items are removed automatically by the
 * ON DELETE CASCADE on the foreign key, so this wipes everything in one go.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req);
  // Deliberately tight — this is destructive and PIN-guarded, so it's also the
  // most attractive endpoint to brute force.
  if (!rateLimit(`registry:delete:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
  }

  try {
    await ensureRegistrySchema();
    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: 'Your PIN is required to delete a registry.' }, { status: 400 });
    }

    const registry = await findRegistryById(params.id);
    if (!registry) {
      return NextResponse.json({ error: 'Registry not found.' }, { status: 404 });
    }

    const valid = await verifyRegistryPin(params.id, String(pin));
    if (!valid) {
      console.error(`[registry DELETE] PIN verification failed for registry ${params.id}`);
      return NextResponse.json({ error: 'That PIN is incorrect.' }, { status: 401 });
    }

    await deleteRegistry(params.id);
    console.log(`[registry DELETE] registry ${params.id} deleted by owner (${registry.email})`);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[registry DELETE]', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
