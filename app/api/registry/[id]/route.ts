import { NextResponse } from 'next/server';
import { findRegistryById, getRegistryItems } from '@/lib/db-registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: public view of a registry (for gifters — no PIN needed)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const registry = await findRegistryById(params.id);
    if (!registry) return NextResponse.json({ error: 'Registry not found.' }, { status: 404 });
    const items = await getRegistryItems(params.id);
    return NextResponse.json({ registry, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
