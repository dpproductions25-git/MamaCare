import { NextResponse } from 'next/server';
import { findRegistryById, getRegistryItems, ensureRegistrySchema } from '@/lib/db-registry';
import { enrichRegistryItems } from '@/lib/registry-enrich';

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
